import type { NextApiRequest, NextApiResponse } from 'next';
import { getGiftFromId, updateGifts, upsertGift } from '@/lib/db/giftManager';
import { Gift } from '@prisma/client';
import { isBackofficeSession } from '@/lib/auth/session';
import { canManageList, canReadList } from '@/lib/auth/giftAccess';
import prisma from '@/lib/db/dbSingleton';
import { parseBody, giftUpsertSchema, giftsReorderSchema } from '@/lib/api/validation';

export type TGiftApiResult = {
    success: boolean;
    giftId?: string;
    gift?: Gift;
    gifts?: Gift[];
    error?: string;
};

// Création/édition : propriétaire de la liste ou admin de son groupe ; un membre du groupe peut suggérer un cadeau
const canUpsertGift = async (req: NextApiRequest, gift: Gift): Promise<boolean> => {
    const existing = gift.id ? await getGiftFromId(gift.id) : null;
    if (existing) return canManageList(req, existing.userId);

    const ownerId = gift.userId;
    if (gift.parentGiftId) {
        const parent = await getGiftFromId(gift.parentGiftId);
        if (!parent || parent.userId !== ownerId) return false;
    }
    if (await canManageList(req, ownerId)) return true;
    return gift.isSuggestedGift === true && !isBackofficeSession(req) && canReadList(req, ownerId);
};

// Réordonnancement : tous les cadeaux doivent venir d'une même liste que l'on gère
const canReorderGifts = async (req: NextApiRequest, gifts: Gift[]): Promise<boolean> => {
    const ids = [...new Set(gifts.map((g) => g.id))];
    const owners = await prisma.gift.findMany({ where: { id: { in: ids } }, select: { userId: true } });
    const ownerIds = new Set(owners.map((o) => o.userId));
    if (owners.length !== ids.length || ownerIds.size !== 1) return false;
    return canManageList(req, [...ownerIds][0]);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TGiftApiResult>) {
    const { body, query } = req;

    try {
        if (req.method === 'POST' && body.gift && !parseBody(giftUpsertSchema, req, res)) return;
        if (req.method === 'POST' && body.gifts && !parseBody(giftsReorderSchema, req, res)) return;

        if (req.method === 'POST') {
            const allowed = body.gift ? await canUpsertGift(req, body.gift) : await canReorderGifts(req, body.gifts ?? []);
            if (!allowed) {
                res.status(403).json({ success: false });
                return;
            }
        }

        if (req.method === 'GET' && query.giftId) {
            const gift = await getGiftFromId(query.giftId as string);

            if (!gift) {
                res.status(404).json({ success: false });
            } else if (!(await canReadList(req, gift.userId))) {
                res.status(403).json({ success: false });
            } else {
                res.status(200).json({ success: true, gift });
            }
        } else if (req.method === 'POST' && body.gift) {
            const gift = await upsertGift(body.gift as Gift);

            res.status(200).json({ success: true, gift });
        } else if (req.method === 'POST' && body.gifts) {
            const gifts = await updateGifts(body.gifts as Gift[]);

            res.status(200).json({ success: true, gifts });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, error: 'Erreur interne' });
    }
}

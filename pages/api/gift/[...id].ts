import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession, isBackofficeSession } from '@/lib/auth/session';
import { parseBody, giftPatchSchema } from '@/lib/api/validation';
import { assertValidCoOwner, deleteGift, getGiftFromId, InvalidCoOwnerError, updateGift } from '@/lib/db/giftManager';
import { isGiftOwner } from '@/lib/giftOwnership';
import { Gift } from '@prisma/client';

export type TGiftApiResult = {
    success: boolean;
    giftId?: string;
    gift?: Gift;
    gifts?: Gift[];
    error?: string;
};

// Écritures réservées au propriétaire du cadeau, à un admin du groupe ou au backoffice
const canWriteGift = async (req: NextApiRequest, giftId: string): Promise<boolean> => {
    if (isBackofficeSession(req)) return true;
    const session = getSession(req);
    if (!session) return false;
    if (session.isAdmin) return true;
    const gift = await getGiftFromId(giftId);
    if (!gift) return false;
    if (isGiftOwner(gift, session.userId)) return true;
    // Un sous-cadeau suit son parent (cadeau commun)
    const parent = gift.parentGiftId ? await getGiftFromId(gift.parentGiftId) : null;
    return !!parent && isGiftOwner(parent, session.userId);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TGiftApiResult>) {
    const { query, body, method } = req;
    const giftId = query.id?.toString();

    try {
        if (method === 'GET' && giftId) {
            const gift = await getGiftFromId(giftId);

            if (gift) {
                res.status(200).json({ success: true, gift });
            } else {
                res.status(404).json({ success: false });
            }
            return;
        }

        if ((method === 'DELETE' || method === 'PATCH' || method === 'PUT') && giftId) {
            if (!(await canWriteGift(req, giftId))) {
                res.status(403).json({ success: false, error: "Vous n'avez pas les droits pour modifier ce cadeau." });
                return;
            }
            if ((method === 'PATCH' || method === 'PUT') && body.gift && !parseBody(giftPatchSchema, req, res)) return;

            // Nouveau partenaire : un autre membre du groupe (le backoffice, sans session, n'est pas contrôlé)
            const session = getSession(req);
            if ((method === 'PATCH' || method === 'PUT') && body.gift?.coOwnerId && session) {
                const current = await getGiftFromId(giftId);
                if (current?.userId) await assertValidCoOwner(current.userId, body.gift.coOwnerId, session.groupId);
            }
        }

        if (method === 'DELETE' && giftId) {
            await deleteGift(giftId);

            res.status(200).json({ success: true });
        } else if (method === 'PATCH' && giftId && body.gift) {
            const gift = await updateGift(giftId, body.gift);

            res.status(200).json({ success: true, gift });
        } else if (method === 'PUT' && giftId && body.gift) {
            const giftToUpdate = await getGiftFromId(giftId);

            if (giftToUpdate) {
                const gift = await updateGift(giftId, { ...giftToUpdate, ...body.gift });

                res.status(200).json({ success: true, gift });
            } else {
                res.status(404).json({ success: false, giftId });
            }
        } else {
            res.status(400).json({ success: false });
        }
    } catch (e) {
        if (e instanceof InvalidCoOwnerError) {
            res.status(400).json({ success: false, error: e.message });
            return;
        }
        console.log(e);
        res.status(500).json({ success: false, error: 'Erreur interne' });
    }
}

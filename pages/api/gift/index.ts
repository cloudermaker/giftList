import type { NextApiRequest, NextApiResponse } from 'next';
import { getGiftFromId, updateGifts, upsertGift } from '@/lib/db/giftManager';
import { Gift } from '@prisma/client';
import { getSession, isBackofficeSession } from '@/lib/auth/session';

export type TGiftApiResult = {
    success: boolean;
    giftId?: string;
    gift?: Gift;
    gifts?: Gift[];
    error?: string;
};

const verbsWithAuthorization = ['POST'];
const isAuthorized = (req: NextApiRequest): boolean => {
    if (!verbsWithAuthorization.includes(req.method as string)) {
        return true;
    }
    if (isBackofficeSession(req)) {
        return true;
    }

    // Session signée : le contenu du cookie ne peut plus être forgé côté client
    const connectedUser = getSession(req);
    if (!connectedUser) return false;

    const userGiftId = req.body?.userGiftId ?? req.query?.userGiftId ?? 'None';
    const giftOwnerId = req.body?.gift?.userId ?? req.body?.gifts?.[0]?.userId;
    const takenUserId = req.body?.gift?.takenUserId;

    // Autorisé si admin du groupe, propriétaire de la liste, cadeau suggéré sur la liste d'un autre,
    // ou cadeau personnel (userId null) créé par le user connecté
    return (
        connectedUser.isAdmin ||
        connectedUser.userId === userGiftId ||
        typeof giftOwnerId === 'string' ||
        (req.body?.gift?.userId === null && takenUserId === connectedUser.userId)
    );
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TGiftApiResult>) {
    const { body, query } = req;

    try {
        const isAuthorizedRequest = await isAuthorized(req);

        if (!isAuthorizedRequest) {
            res.status(403).json({ success: false });
            return;
        }

        if (req.method === 'GET' && query.giftId) {
            const gift = await getGiftFromId(query.giftId as string);

            if (gift) {
                res.status(200).json({ success: true, gift });
                return;
            }

            res.status(404).json({ success: false });
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

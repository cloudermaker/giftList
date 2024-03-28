import type { NextApiRequest, NextApiResponse } from 'next';
import { COOKIE_NAME } from '@/lib/auth/authService';
import { deleteGift, getGiftFromId, updateGift } from '@/lib/db/giftManager';
import { Gift } from '@prisma/client';

export type TGiftApiResult = {
    success: boolean;
    giftId?: string;
    gift?: Gift;
    gifts?: Gift[];
    error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TGiftApiResult>) {
    const { query, body, method, cookies } = req;
    const giftId = query.id?.toString();

    try {
        if (method === 'GET' && giftId) {
            const gift = await getGiftFromId(giftId);

            if (gift) {
                res.status(200).json({ success: true, gift });
            }

            res.status(404).json({ success: false });
        } else if (method === 'DELETE' && giftId && cookies[COOKIE_NAME]) {
            await deleteGift(giftId);

            res.status(200).json({ success: true });
        } else if (method === 'PATCH' && giftId && body.gift && cookies[COOKIE_NAME]) {
            const gift = await updateGift(giftId, body.gift);

            res.status(200).json({ success: true, gift });
        } else if (req.method === 'PUT' && giftId && body.gift && cookies[COOKIE_NAME]) {
            const giftToUpdate = await getGiftFromId(giftId);

            if (giftToUpdate) {
                const gift = await updateGift(giftId, { ...giftToUpdate, ...body.gift });

                res.status(200).json({ success: true, gift });
            }

            res.status(404).json({ success: false, giftId });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, error: e as string });
    }
}

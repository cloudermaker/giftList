import type { NextApiRequest, NextApiResponse } from 'next';
import { getGiftFromId, updateGift, upsertGift } from '@/lib/db/giftManager';
import { Gift } from '@prisma/client';
import { isString } from 'lodash';

export type TGiftApiResult = {
    success: boolean;
    giftId?: string;
    gift?: Gift;
    error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TGiftApiResult>) {
    const { body } = req;

    try {
        if (req.method === 'POST' && body.gift) {
            const gift = await upsertGift(body.gift as Gift);

            res.status(200).json({ success: true, gift });
        } else if (req.method === 'PATCH' && body.gift) {
            const gift = await updateGift(body.gift as Gift);

            res.status(200).json({ success: true, gift });
        } else if (req.method === 'PUT' && isString(req.body.giftId)) {
            const giftToUpdate = await getGiftFromId(req.body.giftId);

            if (giftToUpdate) {
                const gift = await updateGift({ ...giftToUpdate, ...(body.gift as Gift) });

                res.status(200).json({ success: true, gift });
            }

            res.status(404).json({ success: false, giftId: req.body.giftId });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e as string });
    }
}

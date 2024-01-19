import type { NextApiRequest, NextApiResponse } from 'next';
import { upsertGift } from '@/lib/db/giftManager';
import { Gift } from '@prisma/client';

export type TPostGiftResult = {
    success: boolean;
    error: string;
    gift: Gift | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TPostGiftResult>) {
    const { body } = req;

    try {
        let newGift;
        if (body.userGifts) {
            newGift;
        }
        const createdGift = await upsertGift(body.userGift as Gift);

        res.status(200).json({ success: true, error: '', gift: createdGift });
    } catch (e) {
        res.status(500).json({ success: false, error: e as string, gift: null });
    }
}

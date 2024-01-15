import type { NextApiRequest, NextApiResponse } from 'next';
import { createGift, updateGift } from '@/lib/db/giftManager';
import { Gift } from '@prisma/client';

export type TPatchGiftInput = {
    id: string;
    name: string;
    description: string;
    url: string;
    order: number;
};

export type TPatchGiftResult = {
    success: boolean;
    error: string;
    gift: Gift | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TPatchGiftResult>) {
    const { body } = req;

    try {
        const gift = body.userGift as TPatchGiftInput;
        const createdGift = await updateGift(gift.id, gift.name, gift.description, gift.url, gift.order);

        res.status(200).json({ success: true, error: '', gift: createdGift });
    } catch (e) {
        res.status(500).json({ success: false, error: e as string, gift: null });
    }
}

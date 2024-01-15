import type { NextApiRequest, NextApiResponse } from 'next';
import { createGift } from '@/lib/db/giftManager';
import { Gift } from '@prisma/client';

export type TCreateGiftInput = {
    name: string;
    ownerUserId: string;
    description: string;
    url: string;
};

export type TCreateGiftResult = {
    success: boolean;
    error: string;
    gift: Gift | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TCreateGiftResult>) {
    const { body } = req;

    try {
        const gift = body.userGift as TCreateGiftInput;
        const createdGift = await createGift(gift.name, gift.ownerUserId, gift.description, gift.url);

        res.status(200).json({ success: true, error: '', gift: createdGift });
    } catch (e) {
        res.status(500).json({ success: false, error: e as string, gift: null });
    }
}

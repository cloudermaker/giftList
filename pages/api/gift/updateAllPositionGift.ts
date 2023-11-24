import type { NextApiRequest, NextApiResponse } from 'next';
import { updateAllPositionGift } from '../../../lib/db/dbManager';
import { TUserGift } from '../../../lib/types/gift';

export default async function handler(req: NextApiRequest, res: NextApiResponse<boolean>) {
    const { body } = req;

    try {
        const gifts = body.newGifts as TUserGift[];

        await updateAllPositionGift(gifts);

        res.status(200).json(true);
    } catch (e) {
        res.status(500).json(false);
    }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { addOrUpdateGift } from '../../../lib/db/dbManager';
import { TUserGift } from '../../../lib/types/gift';

export type TAddOrUpdateGiftResult = {
  success: boolean,
  error: string,
  giftId: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TAddOrUpdateGiftResult>) {
  const { body } = req;

  try {
    const gift = body.userGift as TUserGift;
    const giftId = await addOrUpdateGift(gift);

    res.status(200).json({ success: giftId != null, error: '', giftId: giftId as string });
  } catch (e) {
    res.status(500).json({ success: false, error: e as string, giftId: '' });
  }
}

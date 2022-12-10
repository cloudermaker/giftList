import type { NextApiRequest, NextApiResponse } from 'next'
import { addOrUpdateGift } from '../../../lib/db/dbManager'

export type TAddOrUpdateGiftResult = {
  success: boolean,
  error: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TAddOrUpdateGiftResult>) {
  const { body } = req;

  try {
    const giftId = await addOrUpdateGift(body.userGift);

    res.status(200).json({ success: giftId != null, error: '' });
  } catch (e) {
    res.status(500).json({ success: false, error: e as string });
  }
}

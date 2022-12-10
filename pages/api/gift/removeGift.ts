import type { NextApiRequest, NextApiResponse } from 'next'
import { removeGift } from '../../../lib/db/dbManager'

export type TRemoveGiftResult = {
  success: boolean,
  error: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TRemoveGiftResult>) {
  const { body } = req;

  try {
    const result = await removeGift(body.giftId);

    res.status(200).json({ success: result, error: '' });
  } catch (e) {
    res.status(500).json({ success: false, error: e as string });
  }
}

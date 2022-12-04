import type { NextApiRequest, NextApiResponse } from 'next'
import { addFamily } from '../../../lib/db/dbManager'

export type TAddFamilyResult = {
  success: boolean,
  error: string,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TAddFamilyResult>) {
  const { body } = req;

  try {
    const result = await addFamily(body.family);

    res.status(200).json({ success: result, error: '' });
  } catch (e) {
    res.status(500).json({ success: false, error: e as string });
  }
}

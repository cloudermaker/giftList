import type { NextApiRequest, NextApiResponse } from 'next'
import { removeUser } from '../../../lib/db/dbManager'

export type TRemoveUserResult = {
  success: boolean,
  error: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TRemoveUserResult>) {
  const { body } = req;

  try {
    const result = await removeUser(body.userId);

    res.status(200).json({ success: result, error: '' });
  } catch (e) {
    res.status(500).json({ success: false, error: e as string });
  }
}

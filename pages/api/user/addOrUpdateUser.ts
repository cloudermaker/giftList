import type { NextApiRequest, NextApiResponse } from 'next'
import { addOrUpdateUser } from '../../../lib/db/dbManager'

export type TAddUserResult = {
  success: boolean,
  error: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TAddUserResult>) {
  const { body } = req;

  try {
    const userId = await addOrUpdateUser(body.familyUser);

    res.status(200).json({ success: userId != null, error: '' });
  } catch (e) {
    res.status(500).json({ success: false, error: e as string });
  }
}

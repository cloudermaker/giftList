import type { NextApiRequest, NextApiResponse } from 'next';
import { addOrUpdateUser } from '../../../lib/db/dbManager';
import { TFamilyUser } from '../../../lib/types/family';

export type TAddUserResult = {
  success: boolean,
  userId: string,
  error: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TAddUserResult>) {
  const { body } = req;

  try {
    const user = body.familyUser as TFamilyUser;
    const userId = await addOrUpdateUser(user);

    res.status(200).json({ success: userId != null, error: '', userId: userId as string });
  } catch (e) {
    res.status(500).json({ success: false, error: e as string, userId: '' });
  }
}

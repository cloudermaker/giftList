import type { NextApiRequest, NextApiResponse } from 'next';
import { removeGroup } from '../../../lib/db/groupManager';

export type TDeleteGroupResult = {
    success: boolean;
    error: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TDeleteGroupResult>) {
    const { body } = req;

    try {
        const result = await removeGroup(body.familyId);

        res.status(200).json({ success: result, error: '' });
    } catch (e) {
        res.status(500).json({ success: false, error: e as string });
    }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { removeFamily } from '../../../lib/db/dbManager';

export type TRemoveFamilyResult = {
    success: boolean;
    error: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TRemoveFamilyResult>) {
    const { body } = req;

    try {
        const result = await removeFamily(body.familyId);

        res.status(200).json({ success: result, error: '' });
    } catch (e) {
        res.status(500).json({ success: false, error: e as string });
    }
}

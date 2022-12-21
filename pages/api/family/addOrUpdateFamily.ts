import type { NextApiRequest, NextApiResponse } from 'next';
import { addOrUpdateFamily } from '../../../lib/db/dbManager';
import { TFamily } from '../../../lib/types/family';

export type TAddFamilyResult = {
    success: boolean;
    error: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TAddFamilyResult>) {
    const { body } = req;

    try {
        const family = body.family as TFamily;
        const familyId = await addOrUpdateFamily(family);

        res.status(200).json({ success: familyId != null, error: '' });
    } catch (e) {
        res.status(500).json({ success: false, error: e as string });
    }
}

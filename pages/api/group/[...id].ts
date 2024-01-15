import type { NextApiRequest, NextApiResponse } from 'next';
import { Group } from '@prisma/client';
import { getGroups, getGroupById } from '../../../lib/db/groupManager';

export type TgetGroupResult = {
    data: Group | null;
    error: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TgetGroupResult>) {
    const { id } = req.query;

    try {
        const result = await getGroupById(id as string);

        if (!result) {
            res.status(404).json({ data: null, error: 'Cannot find this group.' });
        } else {
            res.status(200).json({ data: result, error: '' });
        }
    } catch (e) {
        res.status(500).json({ data: null, error: e as string });
    }
}

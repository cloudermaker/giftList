import type { NextApiRequest, NextApiResponse } from 'next';
import { Group } from '@prisma/client';
import { getGroups } from '../../../lib/db/groupManager';

export type TgetGroupResult = {
    data: Group[];
    error: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TgetGroupResult>) {
    try {
        const result = await getGroups();

        res.status(200).json({ data: result, error: '' });
    } catch (e) {
        res.status(500).json({ data: [], error: e as string });
    }
}

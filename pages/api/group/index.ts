import type { NextApiRequest, NextApiResponse } from 'next';
import { Group } from '@prisma/client';
import { upsertGroup, getGroupByName } from '@/lib/db/groupManager';
import { getSession, isBackofficeSession } from '@/lib/auth/session';

export type TGroupApiResult = {
    success: boolean;
    groupId?: string;
    group?: Group;
    error?: string;
};

const verbsWithAuthorization = ['POST', 'PATCH', 'PUT', 'DELETE'];
const isAuthorized = (req: NextApiRequest): boolean => {
    if (!verbsWithAuthorization.includes(req.method as string)) {
        return true;
    }

    if (isBackofficeSession(req)) {
        return true;
    }

    return getSession(req)?.isAdmin ?? false;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TGroupApiResult>) {
    const { body } = req;

    try {
        if (!isAuthorized(req)) {
            res.status(403).json({ success: false });
            return;
        }

        if (req.method === 'POST' && body.group) {
            const existing = await getGroupByName((body.group as Group).name);
            if (existing) {
                res.status(409).json({ success: false, error: 'Un groupe avec ce nom existe déjà.' });
                return;
            }

            const group = await upsertGroup(body.group as Group);

            res.status(200).json({ success: true, group });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, error: 'Erreur interne' });
    }
}

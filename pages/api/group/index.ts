import type { NextApiRequest, NextApiResponse } from 'next';
import { Group } from '@prisma/client';
import { upsertGroup } from '@/lib/db/groupManager';
import { COOKIE_NAME } from '@/lib/auth/authService';
import { TGroupAndUser } from '../authenticate';

export type TGroupApiResult = {
    success: boolean;
    groupId?: string;
    group?: Group;
    error?: string;
};

const verbsWithAuthorization = ['POST', 'PATCH', 'PUT', 'DELETE'];
const isAuthorized = async (req: NextApiRequest) => {
    if (!verbsWithAuthorization.includes(req.method as string)) {
        return true;
    }

    const connectedUser = JSON.parse(atob(req.cookies[COOKIE_NAME] as string)) as TGroupAndUser;

    return connectedUser?.isAdmin ?? false;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TGroupApiResult>) {
    const { body, cookies } = req;

    try {
        const isAuthorizedRequest = await isAuthorized(req);

        if (!isAuthorizedRequest || !cookies[COOKIE_NAME]) {
            res.status(403).json({ success: false });
            return;
        }

        if (req.method === 'POST' && body.group) {
            const group = await upsertGroup(body.group as Group);

            res.status(200).json({ success: true, group });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, error: e as string });
    }
}

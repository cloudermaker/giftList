import type { NextApiRequest, NextApiResponse } from 'next';
import { Group } from '@prisma/client';
import { isString } from 'lodash';
import { deleteGroup, getGroupById, updateGroup, upsertGroup } from '@/lib/db/groupManager';
import { getUserById } from '@/lib/db/userManager';
import { COOKIE_NAME } from '@/lib/auth/authService';

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

    const connectedUser = await getUserById(req.body?.initiatorUserId ?? req.query?.initiatorUserId ?? '');

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

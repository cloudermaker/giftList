import type { NextApiRequest, NextApiResponse } from 'next';
import { Group } from '@prisma/client';
import { isString } from 'lodash';
import { deletgeGroup, getGroupById, updateGroup, upsertGroup } from '@/lib/db/groupManager';
import { getUserById } from '@/lib/db/userManager';

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
    const { body, query } = req;

    try {
        const isAuthorizedRequest = await isAuthorized(req);

        if (!isAuthorizedRequest) {
            res.status(403).json({ success: false });
            return;
        }

        if (req.method === 'GET' && query.groupId) {
            const group = await getGroupById(query.groupId as string);

            if (group) {
                res.status(200).json({ success: true, group });
            }

            res.status(404).json({ success: false });
        } else if (req.method === 'POST' && body.group) {
            const group = await upsertGroup(body.group as Group);

            res.status(200).json({ success: true, group });
        } else if (req.method === 'PATCH' && body.group) {
            const group = await updateGroup(body.group as Group);

            res.status(200).json({ success: true, group });
        } else if (req.method === 'PUT' && isString(req.body.groupId)) {
            const groupToUpdate = await getGroupById(req.body.groupId);

            if (groupToUpdate) {
                const group = await updateGroup({ ...groupToUpdate, ...(body.group as Group) });

                res.status(200).json({ success: true, group });
            }

            res.status(404).json({ success: false, groupId: req.body.groupId });
        } else if (req.method === 'DELETE' && query.groupId) {
            await deletgeGroup(query.groupId as string);

            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e as string });
    }
}

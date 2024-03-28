import type { NextApiRequest, NextApiResponse } from 'next';
import { Group } from '@prisma/client';
import { deleteGroup, getGroupById, updateGroup, upsertGroup } from '@/lib/db/groupManager';
import { COOKIE_NAME } from '@/lib/auth/authService';

export type TGroupApiResult = {
    success: boolean;
    groupId?: string;
    group?: Group;
    error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TGroupApiResult>) {
    const { query, body, method, cookies } = req;
    const groupId = query.id?.toString();

    try {
        if (method === 'GET' && groupId) {
            const group = await getGroupById(groupId);

            if (group) {
                res.status(200).json({ success: true, group });
            }

            res.status(404).json({ success: false });
        } else if (method === 'DELETE' && groupId && cookies[COOKIE_NAME]) {
            await deleteGroup(groupId);

            res.status(200).json({ success: true });
        } else if (method === 'PATCH' && groupId && body.group && cookies[COOKIE_NAME]) {
            const group = await updateGroup(groupId, body.group as Group);

            res.status(200).json({ success: true, group });
        } else if (method === 'PUT' && groupId && body.group && cookies[COOKIE_NAME]) {
            const groupToUpdate = await getGroupById(body.groupId);

            if (groupToUpdate) {
                const group = await updateGroup(groupId, { ...groupToUpdate, ...(body.group as Group) });

                res.status(200).json({ success: true, group });
            }

            res.status(404).json({ success: false, groupId: body.groupId });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, error: e as string });
    }
}

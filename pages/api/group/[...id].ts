import type { NextApiRequest, NextApiResponse } from 'next';
import { Group } from '@prisma/client';
import { deleteGroup, getGroupById, getGroupByName, updateGroup } from '@/lib/db/groupManager';
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
            } else {
                res.status(404).json({ success: false });
            }
        } else if (method === 'DELETE' && groupId && (cookies[COOKIE_NAME] || cookies['backoffice_session'] === '1')) {
            await deleteGroup(groupId);

            res.status(200).json({ success: true });
        } else if (method === 'PATCH' && groupId && body.group && (cookies[COOKIE_NAME] || cookies['backoffice_session'] === '1')) {
            const existing = await getGroupByName((body.group as Group).name);
            if (existing && existing.id !== groupId) {
                res.status(409).json({ success: false, error: 'Un groupe avec ce nom existe déjà.' });
                return;
            }

            const group = await updateGroup(groupId, body.group as Group);

            res.status(200).json({ success: true, group });
        } else if (method === 'PUT' && groupId && body.group && (cookies[COOKIE_NAME] || cookies['backoffice_session'] === '1')) {
            const groupToUpdate = await getGroupById(groupId);

            if (groupToUpdate) {
                const group = await updateGroup(groupId, { ...groupToUpdate, ...(body.group as Group) });

                res.status(200).json({ success: true, group });
            } else {
                res.status(404).json({ success: false, groupId: groupId });
            }
        } else {
            res.status(400).json({ success: false });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, error: e as string });
    }
}

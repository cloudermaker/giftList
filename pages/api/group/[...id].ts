import type { NextApiRequest, NextApiResponse } from 'next';
import { Group } from '@prisma/client';
import { deleteGroup, getGroupById, getGroupByName, updateGroup } from '@/lib/db/groupManager';
import { getSession, isBackofficeSession } from '@/lib/auth/session';
import { parseBody, groupPatchSchema } from '@/lib/api/validation';

export type TGroupApiResult = {
    success: boolean;
    groupId?: string;
    group?: Group;
    error?: string;
};

// Écritures : backoffice, ou admin (session signée) de CE groupe
const isAuthorized = (req: NextApiRequest, groupId: string): boolean => {
    if (isBackofficeSession(req)) return true;
    const session = getSession(req);
    return (session?.isAdmin ?? false) && session?.groupId === groupId;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TGroupApiResult>) {
    const { query, body, method } = req;
    const groupId = query.id?.toString();

    try {
        if (method === 'GET' && groupId) {
            const group = await getGroupById(groupId);

            if (group) {
                // Ne jamais renvoyer le mot de passe admin
                const { adminPassword, ...safeGroup } = group;
                res.status(200).json({ success: true, group: safeGroup as Group });
            } else {
                res.status(404).json({ success: false });
            }
        } else if ((method === 'DELETE' || method === 'PATCH' || method === 'PUT') && groupId && !isAuthorized(req, groupId)) {
            res.status(403).json({ success: false, error: "Vous n'avez pas les droits pour modifier ce groupe." });
        } else if (method === 'DELETE' && groupId && isAuthorized(req, groupId)) {
            await deleteGroup(groupId);

            res.status(200).json({ success: true });
        } else if (method === 'PATCH' && groupId && body.group && isAuthorized(req, groupId)) {
            if (!parseBody(groupPatchSchema, req, res)) return;
            if ((body.group as Group).name) {
                const existing = await getGroupByName((body.group as Group).name);
                if (existing && existing.id !== groupId) {
                    res.status(409).json({ success: false, error: 'Un groupe avec ce nom existe déjà.' });
                    return;
                }
            }

            const group = await updateGroup(groupId, body.group as Group);

            res.status(200).json({ success: true, group });
        } else if (method === 'PUT' && groupId && body.group && isAuthorized(req, groupId)) {
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
        res.status(500).json({ success: false, error: 'Erreur interne' });
    }
}

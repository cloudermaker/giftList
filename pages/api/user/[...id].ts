import type { NextApiRequest, NextApiResponse } from 'next';
import { getSession, isBackofficeSession } from '@/lib/auth/session';
import { parseBody, userPatchSchema } from '@/lib/api/validation';
import { PublicUser } from '@/lib/db/userManager';
import { deleteUser, getUserById, getUserByGroupAndName, isGroupMember, leaveGroup, updateUser } from '@/lib/db/userManager';
import { getUserGroups, countGroupAdmins, isUserGroupAdmin } from '@/lib/db/userGroupManager';

export type TUserApiResult = {
    success: boolean;
    userId?: string;
    user?: PublicUser;
    error?: string;
};

// Écritures réservées au user lui-même, à un admin de son groupe ou au backoffice
const canWriteUser = async (req: NextApiRequest, targetUserId: string): Promise<boolean> => {
    if (isBackofficeSession(req)) return true;
    const session = getSession(req);
    if (!session) return false;
    if (session.userId === targetUserId) return true;
    return session.isAdmin && (await isGroupMember(targetUserId, session.groupId));
};

// Groupe dont on retire le profil : celui de la session, ou celui passé par le backoffice
const targetGroupId = (req: NextApiRequest): string | undefined =>
    isBackofficeSession(req) ? req.query.groupId?.toString() : getSession(req)?.groupId;

export default async function handler(req: NextApiRequest, res: NextApiResponse<TUserApiResult>) {
    const { query, body, method } = req;
    const userId = query.id?.toString();

    try {
        if (method === 'GET' && userId) {
            const user = await getUserById(userId);

            if (user) {
                res.status(200).json({ success: true, user });
            } else {
                res.status(404).json({ success: false });
            }
        } else if (method === 'DELETE' && userId && (await canWriteUser(req, userId))) {
            const groupId = targetGroupId(req);
            const userGroups = (await getUserGroups(userId)).filter((g) => !groupId || g.id === groupId);

            for (const group of userGroups) {
                if ((await isUserGroupAdmin(userId, group.id)) && (await countGroupAdmins(group.id)) <= 1) {
                    return res.status(400).json({
                        success: false,
                        error: `Impossible de supprimer cet utilisateur : il est le dernier administrateur du groupe "${group.name}".`
                    });
                }
            }

            if (groupId) await leaveGroup(userId, groupId);
            else await deleteUser(userId);

            res.status(200).json({ success: true });
        } else if (method === 'PATCH' && userId && body.user && (await canWriteUser(req, userId))) {
            if (!parseBody(userPatchSchema, req, res)) return;
            if (body.groupId && body.user.name) {
                const existing = await getUserByGroupAndName(body.user.name, body.groupId as string);
                if (existing && existing.id !== userId) {
                    res.status(409).json({ success: false, error: 'Un membre avec ce prénom existe déjà dans ce groupe.' });
                    return;
                }
            }

            const user = await updateUser(userId, body.user as PublicUser);

            res.status(200).json({ success: true, user });
        } else if (req.method === 'PUT' && userId && body.user && (await canWriteUser(req, userId))) {
            const userToUpdate = await getUserById(userId);

            if (userToUpdate) {
                const user = await updateUser(userId, { ...userToUpdate, ...body.user });

                res.status(200).json({ success: true, user });
            } else {
                res.status(404).json({ success: false, userId });
            }
        } else {
            res.status(400).json({ success: false });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, error: 'Erreur interne' });
    }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { COOKIE_NAME, BACKOFFICE_SECRET } from '@/lib/auth/authService';
import { User } from '@prisma/client';
import { deleteUser, getUserById, getUserByGroupAndName, updateUser } from '@/lib/db/userManager';
import { getUserGroups, countGroupAdmins, isUserGroupAdmin } from '@/lib/db/userGroupManager';

export type TUserApiResult = {
    success: boolean;
    userId?: string;
    user?: User;
    error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TUserApiResult>) {
    const { query, body, method, cookies } = req;
    const userId = query.id?.toString();

    try {
        if (method === 'GET' && userId) {
            const user = await getUserById(userId);

            if (user) {
                res.status(200).json({ success: true, user });
            } else {
                res.status(404).json({ success: false });
            }
        } else if (method === 'DELETE' && userId && (cookies[COOKIE_NAME] || req.headers['x-backoffice-secret'] === BACKOFFICE_SECRET)) {
            const userGroups = await getUserGroups(userId);
            
            for (const group of userGroups) {
                const isAdmin = await isUserGroupAdmin(userId, group.id);
                if (isAdmin) {
                    const adminCount = await countGroupAdmins(group.id);
                    if (adminCount <= 1) {
                        return res.status(400).json({ 
                            success: false, 
                            error: `Impossible de supprimer cet utilisateur : il est le dernier administrateur du groupe "${group.name}".` 
                        });
                    }
                }
            }
            
            await deleteUser(userId);

            res.status(200).json({ success: true });
        } else if (method === 'PATCH' && userId && body.user && (cookies[COOKIE_NAME] || req.headers['x-backoffice-secret'] === BACKOFFICE_SECRET)) {
            if (body.groupId && body.user.name) {
                const existing = await getUserByGroupAndName(body.user.name, body.groupId as string);
                if (existing && existing.id !== userId) {
                    res.status(409).json({ success: false, error: 'Un membre avec ce prénom existe déjà dans ce groupe.' });
                    return;
                }
            }

            const user = await updateUser(userId, body.user as User);

            res.status(200).json({ success: true, user });
        } else if (req.method === 'PUT' && userId && body.user && (cookies[COOKIE_NAME] || req.headers['x-backoffice-secret'] === BACKOFFICE_SECRET)) {
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
        res.status(500).json({ success: false, error: e as string });
    }
}

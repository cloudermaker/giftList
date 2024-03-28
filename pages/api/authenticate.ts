import type { NextApiRequest, NextApiResponse } from 'next';
import { createGroup, getGroupByName } from '@/lib/db/groupManager';
import { createUser, getUserByGroupAndName } from '@/lib/db/userManager';

export type TGroupAndUser = {
    groupName: string;
    groupId: string;
    userName: string;
    userId: string;
    isAdmin: boolean;
};

export type TAuthenticateResult = {
    success: boolean;
    groupUser?: TGroupAndUser;
    error: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TAuthenticateResult>) {
    const { groupName, userName, isCreating, password } = req.body;

    try {
        const group = await getGroupByName(groupName);
        const user = await getUserByGroupAndName(userName, group?.id ?? '-1');

        if (isCreating && group != null) {
            res.status(200).json({ success: false, error: 'Ce nom de groupe existe déjà.' });
        } else if (isCreating) {
            const group = await createGroup(groupName);
            const user = await createUser(userName, group.id);

            res.status(200).json({
                success: true,
                error: '',
                groupUser: {
                    groupId: group.id,
                    groupName: group.name,
                    userId: user.id,
                    userName: user.name,
                    isAdmin: user.isAdmin
                }
            });
        } else if (!isCreating && group == null) {
            res.status(200).json({ success: false, error: "Ce nom de groupe n'existe pas." });
        } else if (!isCreating && user == null) {
            res.status(200).json({
                success: false,
                error: "Ce prénom n'existe pas."
            });
        } else if (!isCreating && group && user) {
            if (password && group.adminPassword === password) {
                res.status(200).json({
                    success: true,
                    error: '',
                    groupUser: {
                        groupId: group.id,
                        groupName: group.name,
                        userId: user.id,
                        userName: user.name,
                        isAdmin: true
                    }
                });
            } else if (password && group.adminPassword !== password) {
                res.status(200).json({
                    success: false,
                    error: 'Mauvais mot de passe'
                });
            } else {
                res.status(200).json({
                    success: true,
                    error: '',
                    groupUser: {
                        groupId: group.id,
                        groupName: group.name,
                        userId: user.id,
                        userName: user.name,
                        isAdmin: false
                    }
                });
            }
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e as string });
    }
}

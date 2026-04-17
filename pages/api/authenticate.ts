import type { NextApiRequest, NextApiResponse } from 'next';
import { createGroup, getGroupByName } from '@/lib/db/groupManager';
import { createUser, getUserByGroupAndName } from '@/lib/db/userManager';
import { addUserToGroup } from '@/lib/db/userGroupManager';

export type TGroupAndUser = {
    groupName: string;
    groupId: string;
    groupIds: string[];     // NOUVEAU: Liste de tous les groupes du user
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
            // Créer le groupe et le user
            const group = await createGroup(groupName, password);
            const user = await createUser(userName, group.id);
            
            // Ajouter le user au groupe avec rôle ADMIN (c'est le créateur)
            await addUserToGroup(user.id, group.id, 'ADMIN');

            res.status(200).json({
                success: true,
                error: '',
                groupUser: {
                    groupId: group.id,
                    groupIds: [group.id],
                    groupName: group.name,
                    userId: user.id,
                    userName: user.name,
                    isAdmin: true
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
                        groupIds: [group.id],
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
                // Connexion sans mot de passe = toujours mode user normal (isAdmin: false)
                // même si le user a un rôle ADMIN dans UserGroupMapping
                res.status(200).json({
                    success: true,
                    error: '',
                    groupUser: {
                        groupId: group.id,
                        groupIds: [group.id],
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

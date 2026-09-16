import type { NextApiRequest, NextApiResponse } from 'next';
import { createGroupWithAdmin, getGroupByName } from '@/lib/db/groupManager';
import { getUserByGroupAndName } from '@/lib/db/userManager';
import { Prisma } from '@prisma/client';
import { sessionCookieHeader } from '@/lib/auth/session';

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

    const loginSuccess = (groupUser: TGroupAndUser) => {
        res.setHeader('Set-Cookie', sessionCookieHeader(groupUser));
        res.status(200).json({ success: true, error: '', groupUser });
    };

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
    if (typeof groupName !== 'string' || typeof userName !== 'string' || !groupName.trim() || !userName.trim()) {
        return res.status(400).json({ success: false, error: 'Groupe et prénom requis.' });
    }

    try {
        const group = await getGroupByName(groupName);
        const user = await getUserByGroupAndName(userName, group?.id ?? '-1');

        if (isCreating && group != null) {
            res.status(200).json({ success: false, error: 'Ce nom de groupe existe déjà.' });
        } else if (isCreating) {
            // Créer le groupe, le user admin et le membership atomiquement
            try {
                const { group: newGroup, user: newUser } = await createGroupWithAdmin(groupName, password, userName);
                loginSuccess({ groupId: newGroup.id, groupName: newGroup.name, userId: newUser.id, userName: newUser.name, isAdmin: true });
            } catch (err) {
                // Course sur la contrainte unique du nom de groupe
                if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
                    return res.status(409).json({ success: false, error: 'Ce nom de groupe existe déjà.' });
                }
                throw err;
            }
        } else if (!isCreating && group == null) {
            res.status(200).json({ success: false, error: "Ce nom de groupe n'existe pas." });
        } else if (!isCreating && user == null) {
            res.status(200).json({
                success: false,
                error: "Ce prénom n'existe pas."
            });
        } else if (!isCreating && group && user) {
            if (password && group.adminPassword === password) {
                loginSuccess({ groupId: group.id, groupName: group.name, userId: user.id, userName: user.name, isAdmin: true });
            } else if (password && group.adminPassword !== password) {
                res.status(401).json({
                    success: false,
                    error: 'Mauvais mot de passe'
                });
            } else {
                // Connexion sans mot de passe = toujours mode user normal (isAdmin: false)
                // même si le user a un rôle ADMIN dans UserGroupMapping
                loginSuccess({ groupId: group.id, groupName: group.name, userId: user.id, userName: user.name, isAdmin: false });
            }
        }
    } catch (e) {
        res.status(500).json({ success: false, error: 'Erreur interne' });
    }
}

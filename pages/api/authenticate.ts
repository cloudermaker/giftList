import type { NextApiRequest, NextApiResponse } from 'next';
import { createGroupWithAdmin, getGroupByName, touchGroupActivity } from '@/lib/db/groupManager';
import prisma from '@/lib/db/dbSingleton';
import { hashPassword, isHashed, verifyPassword } from '@/lib/auth/password';
import { getUserByGroupAndName } from '@/lib/db/userManager';
import { Prisma } from '@prisma/client';
import { parseBody, authenticateSchema } from '@/lib/api/validation';
import { sessionCookieHeader } from '@/lib/auth/session';
import { sendVerificationEmail } from '@/lib/auth/emailRecovery';

export type TGroupAndUser = {
    groupName: string;
    groupId: string;
    userName: string;
    userId: string;
    isAdmin: boolean;
    // Session ouverte via un lien email : autorise le changement d'email et le passage d'un groupe à l'autre
    emailAuth?: boolean;
};

export type TAuthenticateResult = {
    success: boolean;
    groupUser?: TGroupAndUser;
    error: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TAuthenticateResult>) {
    const loginSuccess = async (groupUser: TGroupAndUser) => {
        // Attendu : sur Vercel, la fonction peut s'arrêter dès la réponse envoyée
        await touchGroupActivity(groupUser.groupId);
        res.setHeader('Set-Cookie', sessionCookieHeader(groupUser));
        res.status(200).json({ success: true, error: '', groupUser });
    };

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }
    const parsed = parseBody(authenticateSchema, req, res);
    if (!parsed) return;
    const { groupName, userName, isCreating, password, email } = parsed;

    try {
        const group = await getGroupByName(groupName);
        const user = await getUserByGroupAndName(userName, group?.id ?? '-1');

        if (isCreating && group != null) {
            res.status(200).json({ success: false, error: 'Ce nom de groupe existe déjà.' });
        } else if (isCreating) {
            if (!password) {
                return res.status(400).json({ success: false, error: 'Il faut rentrer un mot de passe.' });
            }
            // Créer le groupe, le user admin et le membership atomiquement
            try {
                const { group: newGroup, user: newUser } = await createGroupWithAdmin(groupName, password, userName);
                if (email) {
                    // Créateur = admin : l'email servira aussi de clé admin une fois confirmé
                    await sendVerificationEmail({
                        userId: newUser.id,
                        userName: newUser.name,
                        groupName: newGroup.name,
                        email,
                        grantsAdmin: true
                    }).catch((e) => console.error('Verification email failed:', e));
                }
                await loginSuccess({
                    groupId: newGroup.id,
                    groupName: newGroup.name,
                    userId: newUser.id,
                    userName: newUser.name,
                    isAdmin: true
                });
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
            const passwordOk = password ? await verifyPassword(group.adminPassword, password) : false;
            if (password && passwordOk) {
                // Ancien mot de passe en clair : remplacé par son empreinte dès la première connexion réussie
                if (!isHashed(group.adminPassword)) {
                    await prisma.group.update({ where: { id: group.id }, data: { adminPassword: await hashPassword(password) } });
                }
                await loginSuccess({
                    groupId: group.id,
                    groupName: group.name,
                    userId: user.id,
                    userName: user.name,
                    isAdmin: true
                });
            } else if (password) {
                res.status(401).json({
                    success: false,
                    error: 'Mauvais mot de passe'
                });
            } else {
                // Connexion sans mot de passe = toujours mode user normal (isAdmin: false)
                // même si le user a un rôle ADMIN dans UserGroupMapping
                await loginSuccess({
                    groupId: group.id,
                    groupName: group.name,
                    userId: user.id,
                    userName: user.name,
                    isAdmin: false
                });
            }
        }
    } catch (e) {
        console.error('Error in /api/authenticate:', e);
        res.status(500).json({ success: false, error: 'Erreur interne' });
    }
}

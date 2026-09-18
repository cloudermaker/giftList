import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '@prisma/client';
import { upsertUser, createUser, getUserByGroupAndName } from '@/lib/db/userManager';
import { getGroupUsers } from '@/lib/db/userGroupManager';
import { getSession, isBackofficeSession } from '@/lib/auth/session';
import { parseBody, userCreateSchema } from '@/lib/api/validation';

export type TUserApiResult = {
    success: boolean;
    userId?: string;
    user?: User;
    users?: User[];
    error?: string;
};

const verbsWithAuthorization = ['POST', 'PATCH', 'PUT', 'DELETE'];
const isAuthorized = (req: NextApiRequest): boolean => {
    if (!verbsWithAuthorization.includes(req.method as string)) {
        return true;
    }

    if (isBackofficeSession(req)) {
        return true;
    }

    return getSession(req)?.isAdmin ?? false;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TUserApiResult>) {
    const { body } = req;

    try {
        const isAuthorizedRequest = await isAuthorized(req);

        if (!isAuthorizedRequest) {
            res.status(403).json({ success: false, error: "Vous n'avez pas les droits pour effectuer cette action." });
            return;
        }

        if (req.method === 'POST' && body.user) {
            if (!parseBody(userCreateSchema, req, res)) return;
            const isCreation = !body.user.id || body.user.id === '';
            if (body.groupId && body.user.name) {
                const existing = await getUserByGroupAndName(body.user.name, body.groupId as string);
                if (existing && existing.id !== body.user.id) {
                    res.status(409).json({ success: false, error: 'Un membre avec ce prénom existe déjà dans ce groupe.' });
                    return;
                }
            }

            // Création : user + membership atomiques ; sinon simple mise à jour
            const user =
                isCreation && body.groupId
                    ? await createUser(body.user.name, body.groupId as string, false)
                    : await upsertUser(body.user as User);

            res.status(200).json({ success: true, user });
        } else if (req.method === 'GET' && req.query['groupid']) {
            const userMemberships = await getGroupUsers(req.query['groupid'] as string);
            // Extraire juste les users (sans les infos de membership)
            const users = userMemberships.map((m) => ({
                id: m.id,
                name: m.name,
                isAdmin: m.role === 'ADMIN', // Convertir le rôle en isAdmin pour compatibilité
                acceptSuggestedGift: m.acceptSuggestedGift,
                createdAt: m.createdAt,
                updatedAt: m.updatedAt
            })) as User[];

            res.status(200).json({ success: true, users });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, error: 'Erreur interne' });
    }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '@prisma/client';
import { upsertUser } from '@/lib/db/userManager';
import { getGroupUsers, addUserToGroup } from '@/lib/db/userGroupManager';
import { COOKIE_NAME } from '@/lib/auth/authService';
import { TGroupAndUser } from '../authenticate';

export type TUserApiResult = {
    success: boolean;
    userId?: string;
    user?: User;
    users?: User[];
    error?: string;
};

const verbsWithAuthorization = ['POST', 'PATCH', 'PUT', 'DELETE'];
const isAuthorized = async (req: NextApiRequest) => {
    if (!verbsWithAuthorization.includes(req.method as string)) {
        return true;
    }

    const connectedUser = JSON.parse(atob(req.cookies[COOKIE_NAME] as string)) as TGroupAndUser;

    return connectedUser?.isAdmin ?? false;
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
            const user = await upsertUser(body.user as User);

            const isCreation = !body.user.id || body.user.id === '';
            if (isCreation && body.groupId) {
                await addUserToGroup(user.id, body.groupId as string, 'MEMBER');
            }

            res.status(200).json({ success: true, user });
        } else if (req.method === 'GET' && req.query['groupid']) {
            const userMemberships = await getGroupUsers(req.query['groupid'] as string);
            // Extraire juste les users (sans les infos de membership)
            const users = userMemberships.map(m => ({
                id: m.id,
                name: m.name,
                isAdmin: m.role === 'ADMIN',  // Convertir le rôle en isAdmin pour compatibilité
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
        res.status(500).json({ success: false, error: e as string });
    }
}

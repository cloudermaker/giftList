import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '@prisma/client';
import { isString } from 'lodash';
import { deleteUser, getUserById, updateUser, upsertUser } from '@/lib/db/userManager';
import { COOKIE_NAME } from '@/lib/auth/authService';

export type TUserApiResult = {
    success: boolean;
    userId?: string;
    user?: User;
    error?: string;
};

const verbsWithAuthorization = ['POST', 'PATCH', 'PUT', 'DELETE'];
const isAuthorized = async (req: NextApiRequest) => {
    if (!verbsWithAuthorization.includes(req.method as string)) {
        return true;
    }

    const connectedUser = await getUserById(req.body?.initiatorUserId ?? req.query?.initiatorUserId ?? '');

    return connectedUser?.isAdmin ?? false;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TUserApiResult>) {
    const { body, cookies } = req;

    try {
        const isAuthorizedRequest = await isAuthorized(req);

        if (!isAuthorizedRequest && cookies[COOKIE_NAME]) {
            res.status(403).json({ success: false, error: "Vous n'avez pas les droits pour effectuer cette action." });
            return;
        }

        if (req.method === 'POST' && body.user) {
            const user = await upsertUser(body.user as User);

            res.status(200).json({ success: true, user });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, error: e as string });
    }
}

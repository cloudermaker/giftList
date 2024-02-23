import type { NextApiRequest, NextApiResponse } from 'next';
import { User } from '@prisma/client';
import { isString } from 'lodash';
import { deleteUser, getUserById, updateUser, upsertUser } from '@/lib/db/userManager';
import { error } from 'console';

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
    const { body, query } = req;

    try {
        const isAuthorizedRequest = await isAuthorized(req);

        if (!isAuthorizedRequest) {
            res.status(403).json({ success: false, error: "Vous n'avez pas les droits pour effectuer cette action." });
            return;
        }

        if (req.method === 'GET' && query.userId) {
            const user = await getUserById(query.userId as string);

            if (user) {
                res.status(200).json({ success: true, user });
            }

            res.status(404).json({ success: false });
        } else if (req.method === 'POST' && body.user) {
            const user = await upsertUser(body.user as User);

            res.status(200).json({ success: true, user });
        } else if (req.method === 'PATCH' && body.user) {
            const user = await updateUser(body.user as User);

            res.status(200).json({ success: true, user });
        } else if (req.method === 'PUT' && isString(req.body.userId)) {
            const userToUpdate = await getUserById(req.body.userId);

            if (userToUpdate) {
                const user = await updateUser({ ...userToUpdate, ...(body.user as User) });

                res.status(200).json({ success: true, user });
            }

            res.status(404).json({ success: false, userId: req.body.userId });
        } else if (req.method === 'DELETE' && query.userId) {
            await deleteUser(query.userId as string);

            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e as string });
    }
}

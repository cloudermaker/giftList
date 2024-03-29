import type { NextApiRequest, NextApiResponse } from 'next';
import { COOKIE_NAME } from '@/lib/auth/authService';
import { User } from '@prisma/client';
import { deleteUser, getUserById, updateUser } from '@/lib/db/userManager';

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
        } else if (method === 'DELETE' && userId && cookies[COOKIE_NAME]) {
            await deleteUser(userId);

            res.status(200).json({ success: true });
        } else if (method === 'PATCH' && userId && body.user && cookies[COOKIE_NAME]) {
            const user = await updateUser(userId, body.user as User);

            res.status(200).json({ success: true, user });
        } else if (req.method === 'PUT' && userId && body.user && cookies[COOKIE_NAME]) {
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

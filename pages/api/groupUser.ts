import type { NextApiRequest, NextApiResponse } from 'next';
import { getGroupById } from '@/lib/db/groupManager';
import { getUserById } from '@/lib/db/userManager';

export type TUserInfo = {
    userName: string;
    groupName: string;
};

export type TUserInfoResult = {
    success: boolean;
    groupUser?: TUserInfo;
    error: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TUserInfoResult>) {
    const { groupId, userId } = req.query;

    try {
        if ((groupId && userId) || req.method !== 'GET') {
            const group = await getGroupById(groupId as string);
            const user = await getUserById(userId as string);

            if (group && user) {
                res.status(200).json({
                    success: true,
                    groupUser: { groupName: group.name, userName: user.name },
                    error: ''
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Groupe ou nom inconnu.'
                });
            }
        } else {
            res.status(400).json({
                success: false,
                error: 'Bad request'
            });
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e as string });
    }
}

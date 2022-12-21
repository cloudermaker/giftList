import type { NextApiRequest, NextApiResponse } from 'next';
import { getFamilyFromId, getUserFromId } from '../../lib/db/dbManager';

export type TUserInfo = {
    userName: string;
    familyName: string;
};

export type TUserInfoResult = {
    success: boolean;
    familyUser?: TUserInfo;
    error: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TUserInfoResult>) {
    const { familyId, userId } = req.body;

    try {
        const family = await getFamilyFromId(familyId);
        const user = await getUserFromId(userId);

        if (family && user) {
            res.status(200).json({
                success: true,
                familyUser: { familyName: family.name, userName: user.name },
                error: ''
            });
        } else {
            res.status(404).json({ success: false, error: 'This user or family does not exist.' });
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e as string });
    }
}

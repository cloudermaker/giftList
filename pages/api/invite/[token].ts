import type { NextApiRequest, NextApiResponse } from 'next';
import { getGroupByInviteToken } from '@/lib/db/groupManager';

export type TInviteInfoResult = {
    success: boolean;
    groupName?: string;
    groupId?: string;
    error?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TInviteInfoResult>) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { token } = req.query;

    if (!token || typeof token !== 'string') {
        return res.status(400).json({ success: false, error: 'Token manquant' });
    }

    const group = await getGroupByInviteToken(token);

    if (!group) {
        return res.status(404).json({ success: false, error: "Lien d'invitation invalide." });
    }

    return res.status(200).json({ success: true, groupName: group.name, groupId: group.id });
}

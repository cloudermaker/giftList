import type { NextApiRequest, NextApiResponse } from 'next';
import { getGroupByInviteToken } from '@/lib/db/groupManager';
import { getUserByGroupAndName, createMemberUser } from '@/lib/db/userManager';
import { TAuthenticateResult } from '@/pages/api/authenticate';

export type TInviteJoinResult = TAuthenticateResult & { needsConfirmation?: boolean };

export default async function handler(req: NextApiRequest, res: NextApiResponse<TInviteJoinResult>) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { token, userName, confirm } = req.body;

    if (!token || !userName) {
        return res.status(400).json({ success: false, error: 'Token et prénom requis' });
    }

    try {
        const group = await getGroupByInviteToken(token);

        if (!group) {
            return res.status(200).json({ success: false, error: "Lien d'invitation invalide ou expiré." });
        }

        const user = await getUserByGroupAndName(userName, group.id);

        if (!user && !confirm) {
            // Prénom inconnu : demander confirmation avant de créer un nouveau membre
            return res.status(200).json({ success: false, needsConfirmation: true, error: '' });
        }

        const finalUser = user ?? (await createMemberUser(userName, group.id));

        return res.status(200).json({
            success: true,
            error: '',
            groupUser: {
                groupId: group.id,
                groupIds: [group.id],
                groupName: group.name,
                userId: finalUser.id,
                userName: finalUser.name,
                isAdmin: false
            }
        });
    } catch (e) {
        return res.status(500).json({ success: false, error: e as string });
    }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { createGroup, getGroupByName } from '@/lib/db/groupManager';
import { createUser, getUserByGroupAndName } from '@/lib/db/userManager';

export type TGroupAndUser = {
    groupId: string;
    userId: string;
};

export type TAuthenticateResult = {
    success: boolean;
    groupUser?: TGroupAndUser;
    error: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TAuthenticateResult>) {
    const { groupName, userName, isCreating } = req.body;

    try {
        const group = await getGroupByName(groupName);
        const user = await getUserByGroupAndName(userName, group?.id ?? '-1');

        if (isCreating && group != null) {
            res.status(200).json({ success: false, error: 'Ce nom de groupe existe déjà.' });
        } else if (isCreating) {
            const group = await createGroup(groupName);
            const user = await createUser(userName, group.id);

            res.status(200).json({
                success: true,
                error: '',
                groupUser: { groupId: group.id, userId: user.id }
            });
        } else if (!isCreating && group == null) {
            res.status(200).json({ success: false, error: "Ce nom de groupe n'existe pas." });
        } else if (!isCreating && user == null) {
            res.status(200).json({
                success: false,
                error: "Ce prénom n'existe pas, demande à un membre de la groupe de te rajouter dedans."
            });
        } else if (!isCreating) {
            res.status(200).json({
                success: true,
                error: '',
                groupUser: {
                    groupId: group?.id as string,
                    userId: user?.id as string
                }
            });
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e as string });
    }
}

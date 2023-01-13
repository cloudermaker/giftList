import type { NextApiRequest, NextApiResponse } from 'next';
import { addOrUpdateFamily, addOrUpdateUser, getFamilyFromName, getUserFromName } from '../../lib/db/dbManager';

export type TGroupAndUser = {
    groupId: string;
    userId: string;
};

export type TGetOrCreateGroupAndUserResult = {
    success: boolean;
    groupUser?: TGroupAndUser;
    error: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TGetOrCreateGroupAndUserResult>) {
    const { groupName, userName, isCreating } = req.body;

    try {
        const group = await getFamilyFromName(groupName);
        const user = await getUserFromName(userName, group?.id ?? '-1');

        if (isCreating && group != null) {
            res.status(200).json({ success: false, error: 'Ce nom de famille existe déjà.' });
        } else if (isCreating) {
            const familyId = (await addOrUpdateFamily({
                id: '0',
                name: groupName
            })) as string;
            const userId = (await addOrUpdateUser({
                id: '0',
                name: userName,
                family_id: familyId
            })) as string;

            res.status(200).json({
                success: true,
                error: '',
                groupUser: { groupId: familyId, userId }
            });
        } else if (!isCreating && group == null) {
            res.status(200).json({ success: false, error: "Ce nom de famille n'existe pas." });
        } else if (!isCreating && user == null) {
            res.status(200).json({
                success: false,
                error: "Ce prénom n'existe pas, demande à un membre de la famille de te rajouter dedans."
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

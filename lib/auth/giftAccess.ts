import type { NextApiRequest } from 'next';
import prisma from '@/lib/db/dbSingleton';
import { getSession, isBackofficeSession } from './session';

const isInGroup = async (userId: string, groupId: string): Promise<boolean> =>
    !!(await prisma.userGroupMapping.findUnique({ where: { userId_groupId: { userId, groupId } } }));

/** Le connecté voit les listes des membres de son groupe (la sienne comprise). */
export const canReadList = async (req: NextApiRequest, ownerId: string | null | undefined): Promise<boolean> => {
    if (isBackofficeSession(req)) return true;
    const session = getSession(req);
    if (!session || !ownerId) return false;
    return ownerId === session.userId || isInGroup(ownerId, session.groupId);
};

/** Écriture : le propriétaire de la liste, ou un admin d'un groupe dont il est membre. */
export const canManageList = async (req: NextApiRequest, ownerId: string | null | undefined): Promise<boolean> => {
    if (isBackofficeSession(req)) return true;
    const session = getSession(req);
    if (!session || !ownerId) return false;
    if (ownerId === session.userId) return true;
    return session.isAdmin && isInGroup(ownerId, session.groupId);
};

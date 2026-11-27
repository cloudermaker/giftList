import { User, Prisma } from '@prisma/client';
import prisma from './dbSingleton';

// Utilisateur tel que renvoyé par défaut (colonnes email omises globalement)
export type PublicUser = Omit<User, 'email' | 'emailVerifiedAt' | 'emailIsAdminKey'>;

export const getUserByGroupAndName = async (userName: string, groupId: string): Promise<PublicUser | null> => {
    const user = await prisma.user.findFirst({
        where: {
            AND: [
                {
                    name: {
                        equals: userName.trim(),
                        mode: 'insensitive'
                    }
                },
                {
                    groupMemberships: {
                        some: {
                            groupId: groupId
                        }
                    }
                }
            ]
        }
    });

    return user;
};

export const getUserById = async (userId: string): Promise<PublicUser | null> => {
    var user = await prisma.user.findFirst({
        where: {
            id: userId
        }
    });

    return user;
};

export const getUsersFromGroupId = async (groupId: string): Promise<PublicUser[]> => {
    const users = await prisma.user.findMany({
        where: {
            groupMemberships: {
                some: {
                    groupId: groupId
                }
            }
        }
    });

    return users;
};

// Création atomique user + membership
export const createUser = async (userName: string, userGroupId: string, isAdmin = true): Promise<PublicUser> => {
    return prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: { name: userName.toLowerCase().trim() }
        });
        await tx.userGroupMapping.create({
            data: { userId: user.id, groupId: userGroupId, role: isAdmin ? 'ADMIN' : 'MEMBER', joinedAt: new Date() }
        });
        return user;
    });
};

// Seuls les champs éditables passent à Prisma (liste blanche — tout le reste du body est ignoré)
const editableUserFields = (user: PublicUser) => ({
    ...(user.name ? { name: user.name.toLowerCase().trim() } : {}),
    ...(user.acceptSuggestedGift !== undefined ? { acceptSuggestedGift: user.acceptSuggestedGift } : {})
});

export const upsertUser = async (user: PublicUser): Promise<PublicUser> => {
    const data = editableUserFields(user);

    if (!user.id) {
        return prisma.user.create({
            data: { ...data, name: user.name.toLowerCase().trim() }
        });
    }

    return prisma.user.upsert({
        where: { id: user.id },
        create: { ...data, name: user.name.toLowerCase().trim() },
        update: { ...data, updatedAt: new Date() }
    });
};

export const updateUser = async (userId: string, user: PublicUser): Promise<PublicUser> => {
    const result = await prisma.user.update({
        where: {
            id: userId
        },
        data: { ...editableUserFields(user), updatedAt: new Date() }
    });

    return result;
};

// Cadeaux communs d'un user supprimé : ils passent à son partenaire, en fin de sa liste principale
export const handOverJointGifts = async (tx: Prisma.TransactionClient, userIds: string[]): Promise<void> => {
    const joint = await tx.gift.findMany({
        where: { userId: { in: userIds }, coOwnerId: { not: null }, parentGiftId: null },
        orderBy: { createdAt: 'asc' },
        select: { id: true, coOwnerId: true }
    });
    for (const { id, coOwnerId } of joint) {
        const maxOrder = (await tx.gift.aggregate({ where: { userId: coOwnerId, parentGiftId: null }, _max: { order: true } }))._max
            .order;
        await tx.gift.update({ where: { id }, data: { userId: coOwnerId, coOwnerId: null, order: (maxOrder ?? 0) + 1 } });
        await tx.gift.updateMany({ where: { parentGiftId: id }, data: { userId: coOwnerId } });
    }
};

export const deleteUser = async (userId: string): Promise<void> => {
    await prisma.$transaction(async (tx) => {
        await handOverJointGifts(tx, [userId]);
        await tx.user.deleteMany({ where: { id: userId } });
    });
};

// Retire le profil d'un seul groupe ; le user n'est supprimé que s'il n'a plus aucun groupe
export const leaveGroup = async (userId: string, groupId: string): Promise<void> => {
    await prisma.$transaction(async (tx) => {
        await tx.userGroupMapping.deleteMany({ where: { userId, groupId } });
        const remaining = (await tx.userGroupMapping.findMany({ where: { userId }, select: { groupId: true } })).map(
            (m) => m.groupId
        );
        if (remaining.length === 0) {
            await handOverJointGifts(tx, [userId]);
            await tx.user.deleteMany({ where: { id: userId } });
            return;
        }
        await tx.personalGift.deleteMany({ where: { userId, groupId } });
        await tx.personalGift.updateMany({ where: { forUserId: userId, groupId }, data: { forUserId: null } });
        // Réservations sur les listes de membres avec qui il ne partage plus aucun groupe
        await tx.userTakenGift.deleteMany({
            where: { userId, gift: { user: { groupMemberships: { none: { groupId: { in: remaining } } } } } }
        });
    });
};

export class MergeError extends Error {}

// Fusionne dropId dans keepId : groupes, cadeaux, réservations et cadeaux personnels passent sur keepId
export const mergeUsers = async (keepId: string, dropId: string): Promise<void> => {
    await prisma.$transaction(async (tx) => {
        const [keep, drop] = await Promise.all([
            tx.user.findUnique({ where: { id: keepId }, include: { groupMemberships: true } }),
            tx.user.findUnique({ where: { id: dropId }, include: { groupMemberships: true } })
        ]);
        if (!keep || !drop) throw new MergeError('Profil introuvable.');

        const dropGroupIds = drop.groupMemberships.map((m) => m.groupId);
        if (keep.groupMemberships.some((m) => dropGroupIds.includes(m.groupId))) {
            throw new MergeError('Ces deux profils sont déjà dans un même groupe.');
        }
        const homonym = await tx.user.findFirst({
            where: {
                id: { not: dropId },
                name: { equals: keep.name, mode: 'insensitive' },
                groupMemberships: { some: { groupId: { in: dropGroupIds } } }
            }
        });
        if (homonym) throw new MergeError(`Un autre membre s'appelle déjà « ${keep.name} » dans l'autre groupe.`);

        // Les cadeaux de l'autre profil passent à la suite de la liste
        const maxOrder = (await tx.gift.aggregate({ where: { userId: keepId, parentGiftId: null }, _max: { order: true } }))._max
            .order;
        await tx.gift.updateMany({
            where: { userId: dropId, parentGiftId: null },
            data: { order: { increment: (maxOrder ?? -1) + 1 } }
        });
        await tx.gift.updateMany({ where: { userId: dropId }, data: { userId: keepId } });
        // Cadeaux communs : le profil conservé reprend la place du partenaire fusionné
        await tx.gift.updateMany({ where: { coOwnerId: dropId }, data: { coOwnerId: keepId } });
        await tx.gift.updateMany({ where: { userId: keepId, coOwnerId: keepId }, data: { coOwnerId: null } });

        // Une seule réservation par cadeau (cas UNLIMITED réservé depuis les deux profils)
        const keepTaken = (await tx.userTakenGift.findMany({ where: { userId: keepId }, select: { giftId: true } })).map(
            (t) => t.giftId
        );
        await tx.userTakenGift.deleteMany({ where: { userId: dropId, giftId: { in: keepTaken } } });
        await tx.userTakenGift.updateMany({ where: { userId: dropId }, data: { userId: keepId } });

        await tx.personalGift.updateMany({ where: { userId: dropId }, data: { userId: keepId } });
        await tx.personalGift.updateMany({ where: { forUserId: dropId }, data: { forUserId: keepId } });
        await tx.userGroupMapping.updateMany({ where: { userId: dropId }, data: { userId: keepId } });
        await tx.loginToken.deleteMany({ where: { userId: dropId } });

        if (drop.emailIsAdminKey && !keep.emailIsAdminKey) {
            await tx.user.update({ where: { id: keepId }, data: { emailIsAdminKey: true } });
        }
        await tx.user.delete({ where: { id: dropId } });
    });
};

export const isGroupMember = async (userId: string, groupId: string): Promise<boolean> =>
    (await prisma.userGroupMapping.count({ where: { userId, groupId } })) > 0;

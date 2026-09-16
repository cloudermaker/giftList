import { User } from '@prisma/client';
import prisma from './dbSingleton';

export const getUserByGroupAndName = async (userName: string, groupId: string): Promise<User | null> => {
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

export const getUserById = async (userId: string): Promise<User | null> => {
    var user = await prisma.user.findFirst({
        where: {
            id: userId
        }
    });

    return user;
};

export const getUsersFromGroupId = async (groupId: string): Promise<User[]> => {
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
export const createUser = async (userName: string, userGroupId: string, isAdmin = true): Promise<User> => {
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
const editableUserFields = (user: User) => ({
    ...(user.name ? { name: user.name.toLowerCase().trim() } : {}),
    ...(user.acceptSuggestedGift !== undefined ? { acceptSuggestedGift: user.acceptSuggestedGift } : {})
});

export const upsertUser = async (user: User): Promise<User> => {
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

export const updateUser = async (userId: string, user: User): Promise<User> => {
    const result = await prisma.user.update({
        where: {
            id: userId
        },
        data: { ...editableUserFields(user), updatedAt: new Date() }
    });

    return result;
};

export const deleteUser = async (userId: string): Promise<void> => {
    await prisma.user.deleteMany({
        where: {
            id: userId
        }
    });
};

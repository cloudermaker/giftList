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

export const upsertUser = async (user: User): Promise<User> => {
    const { id, createdAt, updatedAt, gifts, groupMemberships, takenGifts, personalGifts, personalGiftsReceived, userTakenGifts, personalGiftsFor, isAdmin, ...userData } = user as any;

    if (!id) {
        return prisma.user.create({
            data: { ...userData, name: user.name.toLowerCase().trim() }
        });
    }

    return prisma.user.upsert({
        where: { id },
        create: { ...userData, name: user.name.toLowerCase().trim() },
        update: { ...userData, name: user.name.toLowerCase().trim(), updatedAt: new Date() }
    });
};

export const updateUser = async (userId: string, user: User): Promise<User> => {
    const { id, createdAt, updatedAt, gifts, groupMemberships, takenGifts, personalGifts, personalGiftsReceived, userTakenGifts, personalGiftsFor, isAdmin, ...userData } = user as any;
    
    const result = await prisma.user.update({
        where: {
            id: userId
        },
        data: { ...userData, ...(user.name ? { name: user.name.toLowerCase().trim() } : {}), updatedAt: new Date() }
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

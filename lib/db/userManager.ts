import { User } from '@prisma/client';
import prisma from './dbSingleton';
import { addUserToGroup } from './userGroupManager';

export const getUsers = async (): Promise<User[]> => {
    var users = await prisma.user.findMany();

    return users;
};

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

export const createUser = async (userName: string, userGroupId: string): Promise<User> => {
    const user = await prisma.user.create({
        data: {
            name: userName.toLowerCase().trim(),
            isAdmin: true
        }
    });

    await addUserToGroup(user.id, userGroupId, 'ADMIN');

    return user;
};

export const upsertUser = async (user: User): Promise<User> => {
    const { id, createdAt, updatedAt, gifts, groupMemberships, takenGifts, personalGifts, personalGiftsReceived, userTakenGifts, personalGiftsFor, ...userData } = user as any;
    
    const result = await prisma.user.upsert({
        where: {
            id: user.id
        },
        create: { ...userData, name: user.name.toLowerCase().trim() },
        update: { ...userData, name: user.name.toLowerCase().trim(), updatedAt: new Date() }
    });

    return result;
};

export const updateUser = async (userId: string, user: User): Promise<User> => {
    const { id, createdAt, updatedAt, gifts, groupMemberships, takenGifts, personalGifts, personalGiftsReceived, userTakenGifts, personalGiftsFor, ...userData } = user as any;
    
    const result = await prisma.user.update({
        where: {
            id: userId
        },
        data: { ...userData, name: user.name.toLowerCase().trim(), updatedAt: new Date() }
    });

    return result;
};

export const deleteUser = async (userId: string): Promise<void> => {
    await prisma.user.delete({
        where: {
            id: userId
        }
    });
};

import { User } from '@prisma/client';
import prisma from './dbSingleton';

export const buildDefaultUser = (groupId: string): User => {
    return {
        id: '',
        name: '',
        groupId,
        isAdmin: false,
        acceptSuggestedGift: false,
        updatedAt: new Date(),
        createdAt: new Date()
    };
};

export const getUsers = async (): Promise<User[]> => {
    var users = await prisma.user.findMany();

    return users;
};

export const getUserByGroupAndName = async (userName: string, groupId: string): Promise<User | null> => {
    var user = await prisma.user.findFirst({
        where: {
            AND: [
                {
                    name: {
                        equals: userName.trim(),
                        mode: 'insensitive'
                    }
                },
                {
                    groupId
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
    var users = await prisma.user.findMany({
        where: {
            groupId
        }
    });

    return users;
};

export const createUser = async (userName: string, userGroupId: string): Promise<User> => {
    var user = await prisma.user.create({
        data: {
            name: userName.toLowerCase().trim(),
            groupId: userGroupId,
            isAdmin: true
        }
    });

    return user;
};

export const upsertUser = async (user: User): Promise<User> => {
    var user = await prisma.user.upsert({
        where: {
            id: user.id
        },
        create: { ...user, name: user.name.toLowerCase().trim(), id: undefined },
        update: { ...user, name: user.name.toLowerCase().trim(), updatedAt: new Date().toISOString() }
    });

    return user;
};

export const updateUser = async (userId: string, user: User): Promise<User> => {
    var user = await prisma.user.update({
        where: {
            id: userId
        },
        data: { ...user, name: user.name.toLowerCase().trim(), updatedAt: new Date().toISOString() }
    });

    return user;
};

export const deleteUser = async (userId: string): Promise<void> => {
    await prisma.user.delete({
        where: {
            id: userId
        }
    });
};

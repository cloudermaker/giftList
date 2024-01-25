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
                    name: userName
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
            name: userName,
            groupId: userGroupId
        }
    });

    return user;
};

export const upsertUser = async (user: User): Promise<User> => {
    var user = await prisma.user.upsert({
        where: {
            id: user.id
        },
        create: { ...user, id: undefined },
        update: { ...user, updatedAt: undefined }
    });

    return user;
};

export const updateUser = async (user: User): Promise<User> => {
    var user = await prisma.user.update({
        where: {
            id: user.id
        },
        data: { ...user, updatedAt: undefined }
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

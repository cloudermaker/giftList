import { User } from '@prisma/client';
import prisma from './dbSingleton';

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

export const createUser = async (userName: string, userGroupId: string): Promise<User> => {
    var user = await prisma.user.create({
        data: {
            name: userName,
            groupId: userGroupId
        }
    });

    return user;
};

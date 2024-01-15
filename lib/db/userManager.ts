import { User } from '@prisma/client';
import prisma from './dbSingleton';

export const getUsers = async (): Promise<User[]> => {
    var users = await prisma.user.findMany();

    return users;
};

export const getUserByGroupAndName = async (userName: string, groupId: string): Promise<User | null> => {
    var users = await prisma.user.findFirst({
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

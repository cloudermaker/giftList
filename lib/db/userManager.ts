import { User } from '@prisma/client';
import prisma from './dbSingleton';

export const getUsers = async (): Promise<User[]> => {
    var users = await prisma.user.findMany();

    return users;
};

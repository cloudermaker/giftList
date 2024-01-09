import { Group } from '@prisma/client';
import prisma from './dbSingleton';

export const getGroups = async (): Promise<Group[]> => {
    var groups = await prisma.group.findMany();

    return groups;
};

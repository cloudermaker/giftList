import { Group } from '@prisma/client';
import prisma from './dbSingleton';

export const getGroups = async (): Promise<Group[]> => {
    var groups = await prisma.group.findMany();

    return groups;
};

export const getGroupById = async (groupId: string): Promise<Group | null> => {
    var groups = await prisma.group.findFirst({
        where: {
            id: groupId
        }
    });

    return groups;
};

export const getGroupByName = async (groupName: string): Promise<Group | null> => {
    var groups = await prisma.group.findFirst({
        where: {
            name: groupName
        }
    });

    return groups;
};

export const removeGroup = async (groupId: string): Promise<boolean> => {
    var groups = await prisma.group.delete({
        where: {
            id: groupId
        }
    });

    return !!groups;
};

export const createGroup = async (groupName: string, description = '', imageUrl = ''): Promise<Group> => {
    var group = await prisma.group.create({
        data: {
            name: groupName,
            description,
            imageUrl
        }
    });

    return group;
};

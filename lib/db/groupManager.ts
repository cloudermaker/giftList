import { Group } from '@prisma/client';
import prisma from './dbSingleton';

export const buildDefaultGroup = () => {
    return {
        id: '-1',
        name: '',
        description: '',
        imageUrl: '',
        updatedAt: new Date(),
        createdAt: new Date()
    };
};

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
    var group = await prisma.group.findFirst({
        where: {
            name: groupName
        }
    });

    return group;
};

export const deletgeGroup = async (groupId: string): Promise<boolean> => {
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

export const upsertGroup = async (group: Group): Promise<Group> => {
    var newGroup = await prisma.group.upsert({
        where: {
            id: group.id
        },
        create: { ...group, id: undefined },
        update: { ...group, updatedAt: undefined }
    });

    return newGroup;
};

export const updateGroup = async (group: Group): Promise<Group> => {
    var newGroup = await prisma.group.update({
        where: {
            id: group.id
        },
        data: group
    });

    return newGroup;
};

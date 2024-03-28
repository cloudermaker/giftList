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
            name: {
                equals: groupName.toLowerCase().trim(),
                mode: 'insensitive'
            }
        }
    });

    return group;
};

export const deleteGroup = async (groupId: string): Promise<boolean> => {
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
            name: groupName.trim(),
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
        create: { ...group, name: group.name.trim(), id: undefined },
        update: { ...group, name: group.name.trim(), updatedAt: undefined }
    });

    return newGroup;
};

export const updateGroup = async (groupId: string, group: Group): Promise<Group> => {
    var newGroup = await prisma.group.update({
        where: {
            id: groupId
        },
        data: { ...group, name: group.name.trim() }
    });

    return newGroup;
};

import { Group } from '@prisma/client';
import prisma from './dbSingleton';

export const buildDefaultGroup = () => {
    return {
        id: '-1',
        name: '',
        description: '',
        imageUrl: '',
        adminPassword: '',
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

export const createGroup = async (groupName: string, password: string, description = '', imageUrl = ''): Promise<Group> => {
    var group = await prisma.group.create({
        data: {
            name: groupName.trim(),
            adminPassword: password,
            description,
            imageUrl
        }
    });

    return group;
};

export const upsertGroup = async (group: Group): Promise<Group> => {
    const { id, createdAt, updatedAt, users, personalGifts, userMemberships, ...groupData } = group as any;
    
    const newGroup = await prisma.group.upsert({
        where: {
            id: group.id
        },
        create: { ...groupData, name: group.name.trim() },
        update: { ...groupData, name: group.name.trim(), updatedAt: new Date() }
    });

    return newGroup;
};

export const updateGroup = async (groupId: string, group: Group): Promise<Group> => {
    const { id, createdAt, updatedAt, users, personalGifts, userMemberships, ...groupData } = group as any;
    
    const newGroup = await prisma.group.update({
        where: {
            id: groupId
        },
        data: { ...groupData, name: group.name.trim(), updatedAt: new Date() }
    });

    return newGroup;
};

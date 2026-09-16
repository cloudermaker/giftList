import { Group } from '@prisma/client';
import { randomBytes } from 'crypto';
import prisma from './dbSingleton';

export const buildDefaultGroup = () => {
    return {
        id: '-1',
        name: '',
        adminPassword: '',
        inviteToken: null,
        updatedAt: new Date(),
        createdAt: new Date()
    };
};

const generateInviteToken = (): string => randomBytes(5).toString('hex');

export type TGroupSummary = { id: string; name: string; createdAt: Date | null };

export const getGroupsPage = async (page: number, pageSize = 10): Promise<{ groups: TGroupSummary[]; totalCount: number }> => {
    const [groups, totalCount] = await prisma.$transaction([
        prisma.group.findMany({
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, createdAt: true }
        }),
        prisma.group.count()
    ]);

    return { groups, totalCount };
};

export const getGroupById = async (groupId: string): Promise<Group | null> => {
    return prisma.group.findUnique({
        where: {
            id: groupId
        }
    });
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

export const getGroupByInviteToken = async (token: string): Promise<Group | null> => {
    return prisma.group.findUnique({ where: { inviteToken: token } });
};

export const ensureGroupInviteToken = async (groupId: string): Promise<string> => {
    const token = generateInviteToken();
    // Update atomique : n'écrase pas un token déjà présent
    const result = await prisma.group.updateMany({
        where: { id: groupId, inviteToken: null },
        data: { inviteToken: token }
    });
    if (result.count > 0) return token;
    // Un token existait déjà (écrit par une requête concurrente) : on le relit
    const group = await getGroupById(groupId);
    return group!.inviteToken!;
};

// Création atomique groupe + user admin + membership (utilisé par /api/authenticate)
export const createGroupWithAdmin = async (groupName: string, password: string, userName: string) => {
    return prisma.$transaction(async (tx) => {
        const group = await tx.group.create({
            data: {
                name: groupName.trim(),
                adminPassword: password,
                inviteToken: generateInviteToken()
            }
        });
        const user = await tx.user.create({
            data: { name: userName.toLowerCase().trim() }
        });
        await tx.userGroupMapping.create({
            data: { userId: user.id, groupId: group.id, role: 'ADMIN', joinedAt: new Date() }
        });
        return { group, user };
    });
};

export const upsertGroup = async (group: Group): Promise<Group> => {
    const { id, createdAt, updatedAt, users, personalGifts, userMemberships, description, imageUrl, ...groupData } = group as any;
    
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
    const { id, createdAt, updatedAt, users, personalGifts, userMemberships, description, imageUrl, ...groupData } = group as any;
    
    const newGroup = await prisma.group.update({
        where: {
            id: groupId
        },
        data: { ...groupData, ...(group.name ? { name: group.name.trim() } : {}), updatedAt: new Date() }
    });

    return newGroup;
};

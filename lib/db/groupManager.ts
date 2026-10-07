import { Group } from '@prisma/client';
import { randomBytes } from 'crypto';
import prisma from './dbSingleton';
import { hashPassword, isHashed } from '@/lib/auth/password';

export const buildDefaultGroup = () => {
    return {
        id: '-1',
        name: '',
        adminPassword: '',
        inviteToken: null,
        lastActivityAt: new Date(),
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

// Supprime le groupe ET les profils qui n'appartiennent qu'à lui (cadeaux, réservations et emails partent en cascade)
export const deleteGroup = async (groupId: string): Promise<boolean> => {
    return prisma.$transaction(async (tx) => {
        await tx.user.deleteMany({
            where: {
                groupMemberships: { some: { groupId }, every: { groupId } }
            }
        });
        const { count } = await tx.group.deleteMany({ where: { id: groupId } });
        return count > 0;
    });
};

// Durée de conservation : un groupe sans aucune connexion pendant 3 ans est supprimé (voir /confidentialite)
export const RETENTION_YEARS = 3;

// Mis à jour au plus une fois par jour pour ne pas écrire à chaque connexion
export const touchGroupActivity = async (groupId: string): Promise<void> => {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.group.updateMany({
        where: { id: groupId, lastActivityAt: { lt: dayAgo } },
        data: { lastActivityAt: new Date() }
    });
};

export const purgeInactiveGroups = async (): Promise<{ groups: number; orphanUsers: number; tokens: number }> => {
    const limit = new Date();
    limit.setFullYear(limit.getFullYear() - RETENTION_YEARS);
    const stale = await prisma.group.findMany({ where: { lastActivityAt: { lt: limit } }, select: { id: true } });
    for (const { id } of stale) await deleteGroup(id);

    // Profils sans aucun groupe (laissés par les suppressions d'avant ce correctif) : inaccessibles, donc supprimés
    const orphans = await prisma.user.deleteMany({ where: { groupMemberships: { none: {} } } });
    const tokens = await prisma.loginToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }] }
    });
    return { groups: stale.length, orphanUsers: orphans.count, tokens: tokens.count };
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
        const adminPassword = await hashPassword(password);
        const group = await tx.group.create({
            data: {
                name: groupName.trim(),
                adminPassword,
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

// Haché une seule fois : un PUT renvoie le groupe stocké, dont le mot de passe est déjà une empreinte
const toStoredPassword = async (password: string): Promise<string> => (isHashed(password) ? password : hashPassword(password));

// Seuls les champs éditables passent à Prisma (liste blanche — tout le reste du body est ignoré)
const editableGroupFields = async (group: Group) => ({
    ...(group.name ? { name: group.name.trim() } : {}),
    ...(group.adminPassword !== undefined ? { adminPassword: await toStoredPassword(group.adminPassword) } : {})
});

export const upsertGroup = async (group: Group): Promise<Group> => {
    const data = await editableGroupFields(group);

    const newGroup = await prisma.group.upsert({
        where: {
            id: group.id
        },
        create: { name: group.name.trim(), adminPassword: await toStoredPassword(group.adminPassword ?? '') },
        update: { ...data, updatedAt: new Date() }
    });

    return newGroup;
};

export const updateGroup = async (groupId: string, group: Group): Promise<Group> => {
    const newGroup = await prisma.group.update({
        where: {
            id: groupId
        },
        data: { ...(await editableGroupFields(group)), updatedAt: new Date() }
    });

    return newGroup;
};

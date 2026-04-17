/**
 * User Group Manager
 * Gère les relations many-to-many entre users et groupes via UserGroupMapping
 */

import { Role } from '@prisma/client';
import prisma from './dbSingleton';

/**
 * Récupérer tous les groupes d'un user
 */
export const getUserGroups = async (userId: string) => {
  const memberships = await prisma.userGroupMapping.findMany({
    where: { userId },
    include: {
      group: true
    },
    orderBy: { joinedAt: 'asc' }
  });
  
  return memberships.map(m => ({
    ...m.group,
    role: m.role,
    joinedAt: m.joinedAt
  }));
};

/**
 * Récupérer tous les users d'un groupe
 */
export const getGroupUsers = async (groupId: string) => {
  const memberships = await prisma.userGroupMapping.findMany({
    where: { groupId },
    include: {
      user: true
    },
    orderBy: { user: { name: 'asc' } }
  });
  
  return memberships.map(m => ({
    ...m.user,
    role: m.role,
    joinedAt: m.joinedAt
  }));
};

/**
 * Ajouter un user à un groupe
 */
export const addUserToGroup = async (
  userId: string, 
  groupId: string, 
  role: Role = 'MEMBER'
) => {
  return await prisma.userGroupMapping.create({
    data: {
      userId,
      groupId,
      role,
      joinedAt: new Date()
    },
    include: {
      user: true,
      group: true
    }
  });
};

/**
 * Retirer un user d'un groupe
 */
export const removeUserFromGroup = async (userId: string, groupId: string) => {
  return await prisma.userGroupMapping.deleteMany({
    where: {
      userId,
      groupId
    }
  });
};

/**
 * Vérifier si un user est dans un groupe
 */
export const isUserInGroup = async (userId: string, groupId: string) => {
  const membership = await prisma.userGroupMapping.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId
      }
    }
  });
  
  return membership !== null;
};

/**
 * Changer le rôle d'un user dans un groupe
 */
export const updateUserRole = async (
  userId: string, 
  groupId: string, 
  role: Role
) => {
  return await prisma.userGroupMapping.update({
    where: {
      userId_groupId: {
        userId,
        groupId
      }
    },
    data: { role }
  });
};

/**
 * Récupérer le premier groupe d'un user (pour compatibilité)
 */
export const getUserPrimaryGroup = async (userId: string) => {
  const membership = await prisma.userGroupMapping.findFirst({
    where: { userId },
    include: { group: true },
    orderBy: { joinedAt: 'asc' }
  });
  
  return membership?.group || null;
};

/**
 * Récupérer le rôle d'un user dans un groupe spécifique
 */
export const getUserRole = async (userId: string, groupId: string): Promise<Role | null> => {
  const membership = await prisma.userGroupMapping.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId
      }
    }
  });
  
  return membership?.role || null;
};

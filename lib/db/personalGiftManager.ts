/**
 * Personal Gift Manager
 * Gère les cadeaux personnels qu'un user apporte (ex: chocolats, fleurs)
 * Séparés des wishlists normales
 */

import prisma from './dbSingleton';

export interface PersonalGiftData {
  name: string;
  description?: string;
  url?: string;
  userId: string;
  forUserId?: string;
  groupId: string;
}

/**
 * Créer un cadeau personnel
 */
export const createPersonalGift = async (data: PersonalGiftData) => {
  const { userId, forUserId, groupId, ...giftData } = data;
  
  return await prisma.personalGift.create({
    data: {
      ...giftData,
      user: { connect: { id: userId } },
      ...(forUserId && { forUser: { connect: { id: forUserId } } }),
      group: { connect: { id: groupId } },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    include: {
      user: true,
      forUser: true,
      group: true
    }
  });
};

/**
 * Récupérer les cadeaux personnels d'un user dans un groupe
 */
export const getPersonalGiftsByUser = async (userId: string, groupId?: string) => {
  return await prisma.personalGift.findMany({
    where: {
      userId,
      ...(groupId && { groupId })
    },
    include: {
      forUser: true,
      group: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Récupérer les cadeaux personnels d'un groupe
 */
export const getPersonalGiftsByGroup = async (groupId: string) => {
  return await prisma.personalGift.findMany({
    where: { groupId },
    include: {
      user: true,
      forUser: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Récupérer les cadeaux destinés à un user spécifique
 */
export const getPersonalGiftsForUser = async (forUserId: string, groupId?: string) => {
  return await prisma.personalGift.findMany({
    where: {
      forUserId,
      ...(groupId && { groupId })
    },
    include: {
      user: true,
      group: true
    },
    orderBy: { createdAt: 'desc' }
  });
};

/**
 * Récupérer un cadeau personnel par ID
 */
export const getPersonalGiftById = async (id: string) => {
  return await prisma.personalGift.findUnique({
    where: { id },
    include: {
      user: true,
      forUser: true,
      group: true
    }
  });
};

/**
 * Mettre à jour un cadeau personnel
 */
export const updatePersonalGift = async (
  id: string, 
  data: Partial<PersonalGiftData>
) => {
  const { userId, forUserId, groupId, ...giftData } = data;
  
  return await prisma.personalGift.update({
    where: { id },
    data: {
      ...giftData,
      ...(userId && { user: { connect: { id: userId } } }),
      ...(forUserId !== undefined && {
        forUser: forUserId ? { connect: { id: forUserId } } : { disconnect: true }
      }),
      ...(groupId && { group: { connect: { id: groupId } } }),
      updatedAt: new Date()
    },
    include: {
      user: true,
      forUser: true,
      group: true
    }
  });
};

/**
 * Supprimer un cadeau personnel
 */
export const deletePersonalGift = async (id: string) => {
  return await prisma.personalGift.delete({
    where: { id }
  });
};

/**
 * Vérifier si un user est propriétaire d'un cadeau personnel
 */
export const isPersonalGiftOwner = async (giftId: string, userId: string) => {
  const gift = await prisma.personalGift.findUnique({
    where: { id: giftId },
    select: { userId: true }
  });
  
  return gift?.userId === userId;
};

/**
 * User Taken Gift Manager
 * Gère les réservations de cadeaux (remplace Gift.takenUserId)
 */

import prisma from './dbSingleton';

/**
 * Réserver un cadeau (logique hybride parent/enfant)
 * Si le cadeau est MULTIPLE, prend automatiquement tous les sous-cadeaux
 */
export const takeGift = async (userId: string, giftId: string) => {
  // Récupérer le cadeau avec ses sous-cadeaux
  const gift = await prisma.gift.findUnique({
    where: { id: giftId },
    include: { subGifts: true }
  });
  
  if (!gift) {
    throw new Error('Gift not found');
  }
  
  // Vérifier que le user ne prend pas son propre cadeau
  if (gift.userId === userId) {
    throw new Error('Cannot take your own gift');
  }
  
  const taken = [];
  
  // Prendre le cadeau principal
  try {
    const takenGift = await prisma.userTakenGift.create({
      data: {
        userId,
        giftId,
        takenAt: new Date()
      }
    });
    taken.push(takenGift);
  } catch (error: any) {
    // Ignore si déjà pris (erreur de contrainte unique)
    if (error.code !== 'P2002') throw error;
  }
  
  // Si MULTIPLE, prendre aussi tous les sous-cadeaux
  if (gift.giftType === 'MULTIPLE' && gift.subGifts.length > 0) {
    for (const subGift of gift.subGifts) {
      try {
        const takenSubGift = await prisma.userTakenGift.create({
          data: {
            userId,
            giftId: subGift.id,
            takenAt: new Date()
          }
        });
        taken.push(takenSubGift);
      } catch (error: any) {
        if (error.code !== 'P2002') throw error;
      }
    }
  }
  
  return {
    giftId,
    userId,
    subGiftsTaken: taken.map(t => t.giftId)
  };
};

/**
 * Libérer un cadeau réservé
 * Si le cadeau est MULTIPLE, libère aussi tous les sous-cadeaux
 */
export const releaseGift = async (userId: string, giftId: string) => {
  // Récupérer le cadeau avec ses sous-cadeaux
  const gift = await prisma.gift.findUnique({
    where: { id: giftId },
    include: { subGifts: true }
  });
  
  if (!gift) {
    throw new Error('Gift not found');
  }
  
  // Libérer le cadeau principal
  await prisma.userTakenGift.deleteMany({
    where: {
      userId,
      giftId
    }
  });
  
  const released = [giftId];
  
  // Si MULTIPLE, libérer aussi tous les sous-cadeaux
  if (gift.giftType === 'MULTIPLE' && gift.subGifts.length > 0) {
    for (const subGift of gift.subGifts) {
      await prisma.userTakenGift.deleteMany({
        where: {
          userId,
          giftId: subGift.id
        }
      });
      released.push(subGift.id);
    }
  }
  
  return {
    giftId,
    subGiftsReleased: released
  };
};

/**
 * Récupérer tous les cadeaux pris par un user
 */
export const getUserTakenGifts = async (userId: string) => {
  return await prisma.userTakenGift.findMany({
    where: { userId },
    include: {
      gift: {
        include: {
          user: true, // Propriétaire du cadeau
          subGifts: {
            include: {
              takenBy: true
            }
          }
        }
      }
    },
    orderBy: { takenAt: 'desc' }
  });
};

/**
 * Récupérer qui a pris un cadeau spécifique
 */
export const getGiftTakers = async (giftId: string) => {
  return await prisma.userTakenGift.findMany({
    where: { giftId },
    include: {
      user: true
    }
  });
};

/**
 * Vérifier si un cadeau est pris par un user spécifique
 */
export const isGiftTakenByUser = async (giftId: string, userId: string) => {
  const taken = await prisma.userTakenGift.findUnique({
    where: {
      userId_giftId: {
        userId,
        giftId
      }
    }
  });
  
  return taken !== null;
};

/**
 * Vérifier si un cadeau est pris par quelqu'un
 */
export const isGiftTaken = async (giftId: string) => {
  const count = await prisma.userTakenGift.count({
    where: { giftId }
  });
  
  return count > 0;
};

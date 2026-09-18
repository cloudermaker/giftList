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

    // Pour SIMPLE/MULTIPLE : vérifier qu'une réservation n'existe pas déjà (idempotence)
    // Pour UNLIMITED : plusieurs réservations par le même user sont autorisées
    if (gift.giftType !== 'UNLIMITED') {
        const existing = await prisma.userTakenGift.findFirst({ where: { userId, giftId } });
        if (existing) {
            return { giftId, userId, subGiftsTaken: [giftId] };
        }
    }

    // Réservation atomique du cadeau principal + sous-cadeaux
    const taken = await prisma.$transaction(async (tx) => {
        const created = [await tx.userTakenGift.create({ data: { userId, giftId, takenAt: new Date() } })];

        if (gift.giftType === 'MULTIPLE' && gift.subGifts.length > 0) {
            const alreadyTaken = await tx.userTakenGift.findMany({
                where: { userId, giftId: { in: gift.subGifts.map((s) => s.id) } },
                select: { giftId: true }
            });
            const takenIds = new Set(alreadyTaken.map((t) => t.giftId));
            for (const subGift of gift.subGifts.filter((s) => !takenIds.has(s.id))) {
                created.push(await tx.userTakenGift.create({ data: { userId, giftId: subGift.id, takenAt: new Date() } }));
            }
        }
        return created;
    });

    return {
        giftId,
        userId,
        subGiftsTaken: taken.map((t) => t.giftId)
    };
};

/**
 * Libérer une réservation spécifique par son id (pour les cadeaux UNLIMITED)
 */
export const releaseOneTakenGift = async (takenGiftId: string) => {
    await prisma.userTakenGift.delete({ where: { id: takenGiftId } });
    return { success: true };
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

    // Libération atomique : cadeau principal + sous-cadeaux en une seule requête
    const released = [giftId, ...(gift.giftType === 'MULTIPLE' ? gift.subGifts.map((s) => s.id) : [])];
    await prisma.userTakenGift.deleteMany({
        where: {
            userId,
            giftId: { in: released }
        }
    });

    return {
        giftId,
        subGiftsReleased: released
    };
};

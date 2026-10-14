/**
 * User Taken Gift Manager
 * Gère les réservations de cadeaux (remplace Gift.takenUserId)
 */

import prisma from './dbSingleton';
import { BOUGHT_RETENTION_MONTHS } from '../retention';

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
 * Marquer une réservation comme achetée (ou non)
 */
export const setTakenGiftBought = async (takenGiftId: string, bought: boolean) => {
    return await prisma.userTakenGift.update({
        where: { id: takenGiftId },
        data: { boughtAt: bought ? new Date() : null }
    });
};

/**
 * Purge des cadeaux achetés depuis plus de 6 mois (réservations + cadeaux personnels)
 * SIMPLE : retiré de la liste ; MULTIPLE : retiré s'il n'a plus de sous-cadeau ; sinon seule la réservation part
 */
export const purgeBoughtGifts = async (): Promise<{ boughtGifts: number; boughtReservations: number; boughtPersonalGifts: number }> => {
    const limit = new Date();
    limit.setMonth(limit.getMonth() - BOUGHT_RETENTION_MONTHS);

    const rows = await prisma.userTakenGift.findMany({
        where: { boughtAt: { lt: limit } },
        select: { giftId: true, gift: { select: { giftType: true } } }
    });
    const idsOf = (type: string) => rows.filter((r) => r.gift.giftType === type).map((r) => r.giftId);

    // Sous-cadeaux (SIMPLE) d'abord, pour que les MULTIPLE vidés partent aussi
    const simple = await prisma.gift.deleteMany({ where: { id: { in: idsOf('SIMPLE') } } });
    const multiple = await prisma.gift.deleteMany({ where: { id: { in: idsOf('MULTIPLE') }, subGifts: { none: {} } } });
    const reservations = await prisma.userTakenGift.deleteMany({ where: { boughtAt: { lt: limit } } });
    const personal = await prisma.personalGift.deleteMany({ where: { boughtAt: { lt: limit } } });

    return {
        boughtGifts: simple.count + multiple.count,
        boughtReservations: reservations.count,
        boughtPersonalGifts: personal.count
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

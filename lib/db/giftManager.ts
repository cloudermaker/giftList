import { Gift, User, GiftType, Prisma } from '@prisma/client';
import prisma from './dbSingleton';

export type TakenByEntry = { id: string; userId: string; takenAt: Date | string };
export type GiftWithTakenUserId = Gift & {
    takenUserId: string | null;
    subGiftsCount?: number;
    takenByList?: TakenByEntry[];
    userTakenGiftId?: string;
};

export const buildDefaultGift = (
    userId: string,
    order: number,
    name?: string,
    description?: string,
    url?: string
): GiftWithTakenUserId => {
    return {
        id: '',
        name: name ?? '',
        description: description ?? '',
        url: url ?? '',
        userId,
        order,
        takenUserId: null,
        subGiftsCount: 0,
        takenByList: [],
        isSuggestedGift: false,
        giftType: 'SIMPLE' as GiftType,
        parentGiftId: null,
        updatedAt: new Date(),
        createdAt: new Date()
    };
};

export const getGiftFromId = async (id: string): Promise<GiftWithTakenUserId | null> => {
    const gift = await prisma.gift.findFirst({
        where: {
            id
        },
        include: {
            takenBy: true, // Relation UserTakenGift
            _count: { select: { subGifts: true } }
        }
    });

    if (!gift) return null;

    // Ajouter takenUserId depuis UserTakenGift
    const { takenBy, _count, ...giftWithoutTakenBy } = gift as any;
    return {
        ...giftWithoutTakenBy,
        takenUserId: takenBy.length > 0 ? takenBy[0].userId : null,
        takenByList: takenBy.map((t: any) => ({ id: t.id, userId: t.userId, takenAt: t.takenAt })),
        subGiftsCount: _count?.subGifts ?? 0
    } as GiftWithTakenUserId;
};

export const getTakenGiftsFromUserId = async (userId: string): Promise<(GiftWithTakenUserId & { user: User | null })[]> => {
    const takenGiftRecords = await prisma.userTakenGift.findMany({
        where: {
            userId
        },
        include: {
            gift: {
                include: {
                    user: true,
                    takenBy: true, // Pour calculer takenUserId
                    parentGift: true // Pour les sous-cadeaux
                }
            }
        }
    });

    // Extraire les gifts avec leur user et takenUserId
    return takenGiftRecords.map((record) => {
        const { takenBy, ...giftWithoutTakenBy } = record.gift;
        return {
            ...giftWithoutTakenBy,
            takenUserId: takenBy.length > 0 ? takenBy[0].userId : null,
            userTakenGiftId: record.id // ID de la ligne UserTakenGift (unique même pour UNLIMITED)
        } as GiftWithTakenUserId & { user: User | null };
    });
};

export const getGiftsFromUserId = async (userId: string): Promise<GiftWithTakenUserId[]> => {
    // Charger les cadeaux avec les réservations depuis UserTakenGift
    const gifts = await prisma.gift.findMany({
        where: {
            userId,
            parentGiftId: null
        },
        include: {
            takenBy: true, // Relation UserTakenGift
            _count: { select: { subGifts: true } }
        },
        orderBy: {
            order: 'asc'
        }
    });

    // Mapper les gifts en ajoutant takenUserId depuis UserTakenGift
    return gifts.map((gift) => {
        const { takenBy, _count, ...giftWithoutTakenBy } = gift as any;
        return {
            ...giftWithoutTakenBy,
            takenUserId: takenBy.length > 0 ? takenBy[0].userId : null,
            takenByList: takenBy.map((t: any) => ({ id: t.id, userId: t.userId, takenAt: t.takenAt })),
            subGiftsCount: _count?.subGifts ?? 0
        };
    }) as GiftWithTakenUserId[];
};

// Seuls les champs éditables passent à Prisma (liste blanche — tout le reste du body est ignoré)
const editableGiftFields = (gift: Gift) => ({
    ...(gift.name ? { name: gift.name.trim() } : {}),
    ...(gift.description !== undefined ? { description: gift.description } : {}),
    ...(gift.url !== undefined ? { url: gift.url } : {}),
    ...(gift.giftType !== undefined ? { giftType: gift.giftType } : {}),
    ...(gift.isSuggestedGift !== undefined && gift.isSuggestedGift !== null ? { isSuggestedGift: gift.isSuggestedGift } : {}),
    ...(gift.order !== undefined && gift.order !== null ? { order: gift.order } : {})
});

export const updateGift = async (giftId: string, gift: Gift): Promise<Gift> => {
    const result = await prisma.gift.update({
        where: {
            id: giftId
        },
        data: { ...editableGiftFields(gift), updatedAt: new Date() }
    });

    return result;
};

export const updateGifts = async (gifts: Gift[]): Promise<Gift[]> => {
    // Réordonnancement atomique : tout ou rien (un cadeau supprimé entre-temps annule proprement)
    try {
        return await prisma.$transaction(
            gifts.map((gift) =>
                prisma.gift.update({
                    where: { id: gift.id },
                    data: { ...editableGiftFields(gift), updatedAt: new Date() }
                })
            )
        );
    } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') return [];
        throw e;
    }
};

export const upsertGift = async (gift: Gift): Promise<Gift> => {
    const latestGift = await prisma.gift.aggregate({
        where: { userId: gift.userId },
        _max: {
            order: true
        }
    });

    const result = await prisma.gift.upsert({
        where: {
            id: gift.id || 'new-gift-placeholder'
        },
        create: {
            ...editableGiftFields(gift),
            name: gift.name.trim(),
            user: { connect: { id: gift.userId as string } },
            ...(gift.parentGiftId && { parentGift: { connect: { id: gift.parentGiftId } } }),
            updatedAt: new Date(),
            order: (latestGift._max.order ?? 0) + 1
        },
        update: {
            ...editableGiftFields(gift),
            updatedAt: new Date()
        }
    });

    return result;
};

/**
 * Récupérer les sous-cadeaux d'un cadeau parent
 */
export const getSubGifts = async (parentGiftId: string): Promise<GiftWithTakenUserId[]> => {
    const gifts = await prisma.gift.findMany({
        where: {
            parentGiftId
        },
        include: {
            takenBy: true
        },
        orderBy: {
            order: 'asc'
        }
    });

    return gifts.map(({ takenBy, ...gift }) => ({
        ...gift,
        takenUserId: takenBy.length > 0 ? takenBy[0].userId : null
    }));
};

/**
 * Créer un sous-cadeau
 */
export const createSubGift = async (parentGiftId: string, name: string, description?: string, url?: string): Promise<Gift> => {
    // Récupérer l'ordre max des sous-cadeaux existants
    const maxOrder = await prisma.gift.aggregate({
        where: {
            parentGiftId
        },
        _max: {
            order: true
        }
    });

    // Récupérer le parent pour obtenir le userId
    const parent = await prisma.gift.findUnique({
        where: { id: parentGiftId }
    });

    if (!parent || !parent.userId) {
        throw new Error('Parent gift not found or has no owner');
    }

    return await prisma.gift.create({
        data: {
            name: name.trim(),
            description: description?.trim() ?? null,
            url: url?.trim() ?? null,
            user: { connect: { id: parent.userId } },
            parentGift: { connect: { id: parentGiftId } },
            giftType: 'SIMPLE',
            isSuggestedGift: false,
            order: (maxOrder._max.order ?? -1) + 1,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    });
};

export const deleteGift = async (giftId: string): Promise<void> => {
    await prisma.gift.delete({
        where: {
            id: giftId
        }
    });
};

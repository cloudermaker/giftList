import { Gift, User, GiftType } from '@prisma/client';
import prisma from './dbSingleton';

export type GiftWithTakenUserId = Gift & { takenUserId: string | null };

export const buildDefaultGift = (userId: string, order: number, name?: string, description?: string, url?: string): GiftWithTakenUserId => {
    return {
        id: '',
        name: name ?? '',
        description: description ?? '',
        url: url ?? '',
        userId,
        order,
        takenUserId: null,
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
            takenBy: true  // Relation UserTakenGift
        }
    });

    if (!gift) return null;

    // Ajouter takenUserId depuis UserTakenGift
    const { takenBy, ...giftWithoutTakenBy } = gift;
    return {
        ...giftWithoutTakenBy,
        takenUserId: takenBy.length > 0 ? takenBy[0].userId : null
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
                    takenBy: true  // Pour calculer takenUserId
                }
            }
        }
    });

    // Extraire les gifts avec leur user et takenUserId
    return takenGiftRecords.map(record => {
        const { takenBy, ...giftWithoutTakenBy } = record.gift;
        return {
            ...giftWithoutTakenBy,
            takenUserId: takenBy.length > 0 ? takenBy[0].userId : null
        } as GiftWithTakenUserId & { user: User | null };
    });
};

export const getGiftsFromUserId = async (userId: string): Promise<GiftWithTakenUserId[]> => {
    // Charger les cadeaux avec les réservations depuis UserTakenGift
    const gifts = await prisma.gift.findMany({
        where: {
            userId
        },
        include: {
            takenBy: true  // Relation UserTakenGift
        },
        orderBy: {
            order: 'asc'
        }
    });

    // Mapper les gifts en ajoutant takenUserId depuis UserTakenGift
    return gifts.map(gift => {
        const { takenBy, ...giftWithoutTakenBy } = gift;
        return {
            ...giftWithoutTakenBy,
            takenUserId: takenBy.length > 0 ? takenBy[0].userId : null
        };
    }) as GiftWithTakenUserId[];
};

export const updateGift = async (giftId: string, gift: Gift): Promise<Gift> => {
    const { id, createdAt, updatedAt, userId, parentGiftId, takenUserId, user, subGifts, parentGift, takenBy, ...giftData } = gift as any;
    
    const result = await prisma.gift.update({
        where: {
            id: giftId
        },
        data: { ...giftData, name: gift.name.trim(), userId, parentGiftId, updatedAt: new Date() }
    });

    return result;
};

export const updateGifts = async (gifts: Gift[]): Promise<Gift[]> => {
    let updatedGifts: Gift[] = [];
    for (const gift of gifts) {
        const { id, createdAt, updatedAt, userId, parentGiftId, takenUserId, user, subGifts, parentGift, takenBy, ...giftData } = gift as any;
        
        const updatedGift = await prisma.gift.update({
            where: {
                id: gift.id
            },
            data: { ...giftData, name: gift.name.trim(), userId, parentGiftId, updatedAt: new Date() }
        });
        updatedGifts.push(updatedGift);
    }

    return updatedGifts;
};

export const upsertGift = async (gift: Gift): Promise<Gift> => {
    const latestGift = await prisma.gift.aggregate({
        _max: {
            order: true
        }
    });

    // Extraire les champs à gérer séparément
    const { userId, id, createdAt, updatedAt, takenUserId, parentGiftId, ...giftData } = gift as any;
    
    const result = await prisma.gift.upsert({
        where: {
            id: id ?? 'new-gift-placeholder'
        },
        create: { 
            ...giftData,
            user: { connect: { id: userId } },
            ...(parentGiftId && { parentGift: { connect: { id: parentGiftId } } }),
            updatedAt: new Date(),
            order: (latestGift._max.order ?? 0) + 1 
        },
        update: { 
            ...giftData, 
            name: gift.name.trim(), 
            userId,
            parentGiftId,
            updatedAt: new Date()
        }
    });

    return result;
};

/**
 * Récupérer les sous-cadeaux d'un cadeau parent
 */
export const getSubGifts = async (parentGiftId: string): Promise<Gift[]> => {
    return await prisma.gift.findMany({
        where: {
            parentGiftId
        },
        orderBy: {
            order: 'asc'
        }
    });
};

/**
 * Créer un sous-cadeau
 */
export const createSubGift = async (
    parentGiftId: string, 
    name: string, 
    description?: string,
    url?: string
): Promise<Gift> => {
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

/**
 * Récupérer un cadeau avec ses sous-cadeaux et réservations
 */
export const getGiftWithDetails = async (giftId: string) => {
    return await prisma.gift.findUnique({
        where: { id: giftId },
        include: {
            user: true,
            subGifts: {
                include: {
                    takenBy: {
                        include: {
                            user: true
                        }
                    }
                },
                orderBy: {
                    order: 'asc'
                }
            },
            takenBy: {
                include: {
                    user: true
                }
            },
            parentGift: true
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

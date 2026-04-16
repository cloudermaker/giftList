import { Gift, User, GiftType } from '@prisma/client';
import prisma from './dbSingleton';

export const buildDefaultGift = (userId: string, order: number, name?: string, description?: string, url?: string): Gift => {
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

export const getGiftFromId = async (id: string): Promise<Gift | null> => {
    var gift = await prisma.gift.findFirst({
        where: {
            id
        }
    });

    return gift;
};

export const getTakenGiftsFromUserId = async (userId: string): Promise<(Gift & { user: User | null })[]> => {
    var gifts = await prisma.gift.findMany({
        where: {
            takenUserId: userId
        },
        include: {
            user: true
        },
        orderBy: {
            order: 'asc'
        }
    });

    return gifts;
};

export const getGiftsFromUserId = async (userId: string): Promise<Gift[]> => {
    var gifts = await prisma.gift.findMany({
        where: {
            userId
        },
        orderBy: {
            order: 'asc'
        }
    });

    return gifts;
};

export const updateGift = async (giftId: string, gift: Gift): Promise<Gift> => {
    var gift = await prisma.gift.update({
        where: {
            id: giftId
        },
        data: { ...gift, name: gift.name.trim(), updatedAt: new Date().toISOString() }
    });

    return gift;
};

export const updateGifts = async (gifts: Gift[]): Promise<Gift[]> => {
    let updatedGifts: Gift[] = [];
    for (const gift of gifts) {
        const updatedGift = await prisma.gift.update({
            where: {
                id: gift.id
            },
            data: { ...gift, name: gift.name.trim(), updatedAt: new Date().toISOString() }
        });
        updatedGifts.push(updatedGift);
    }

    return updatedGifts;
};

export const upsertGift = async (gift: Gift): Promise<Gift> => {
    var latestGift = await prisma.gift.aggregate({
        _max: {
            order: true
        }
    });

    var user = await prisma.gift.upsert({
        where: {
            id: gift.id ?? 'new-gift-placeholder'
        },
        create: { ...gift, id: undefined, updatedAt: new Date().toISOString(), order: latestGift._max.order ?? 0 + 1 },
        update: { ...gift, name: gift.name.trim(), updatedAt: new Date().toISOString() }
    });

    return user;
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

    if (!parent) {
        throw new Error('Parent gift not found');
    }

    return await prisma.gift.create({
        data: {
            name: name.trim(),
            description: description?.trim() ?? null,
            url: url?.trim() ?? null,
            userId: parent.userId,
            parentGiftId,
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

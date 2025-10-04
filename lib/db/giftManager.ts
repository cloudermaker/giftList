import { Gift, User } from '@prisma/client';
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
            id: gift.id
        },
        create: { ...gift, id: undefined, updatedAt: new Date().toISOString(), order: latestGift._max.order ?? 0 + 1 },
        update: { ...gift, name: gift.name.trim(), updatedAt: new Date().toISOString() }
    });

    return user;
};

export const deleteGift = async (giftId: string): Promise<void> => {
    await prisma.gift.delete({
        where: {
            id: giftId
        }
    });
};

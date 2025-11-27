import { Gift, User } from '@prisma/client';
import prisma from './dbSingleton';

export const buildDefaultGift = (
    userId: string,
    order: number,
    name?: string,
    description?: string,
    url?: string
): Omit<Gift, 'id'> => {
    return {
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
        data: { ...gift, name: gift.name.trim(), updatedAt: new Date() }
    });

    return gift;
};

export const updateGifts = async (gifts: Gift[]): Promise<Gift[]> => {
    return await prisma.$transaction(
        gifts.map((gift) =>
            prisma.gift.update({
                where: {
                    id: gift.id
                },
                data: { ...gift, name: gift.name.trim(), updatedAt: new Date() }
            })
        )
    );
};

export const upsertGift = async (gift: Gift): Promise<Gift> => {
    var latestGift = await prisma.gift.aggregate({
        _max: {
            order: true
        }
    });

    var user = await prisma.gift.upsert({
        where: {
            id: (gift.id && gift.id.trim()) || crypto.randomUUID()
        },
        create: { ...gift, id: undefined, updatedAt: new Date(), order: latestGift._max.order ?? 0 + 1 },
        update: { ...gift, name: gift.name.trim(), updatedAt: new Date() }
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

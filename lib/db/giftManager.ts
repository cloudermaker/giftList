import { Gift } from '@prisma/client';
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

export const getGifts = async (): Promise<Gift[]> => {
    var gifts = await prisma.gift.findMany();

    return gifts;
};

export const getGiftFromId = async (id: string): Promise<Gift | null> => {
    var gift = await prisma.gift.findFirst({
        where: {
            id
        }
    });

    return gift;
};

export const getGiftsFromUserId = async (userId: string): Promise<Gift[]> => {
    var gifts = await prisma.gift.findMany({
        where: {
            userId
        }
    });

    return gifts;
};

export const createGift = async (
    giftName: string,
    ownerUserId: string,
    description: string,
    url: string,
    isSuggestedGift = false
): Promise<Gift> => {
    var users = await getGifts();

    var user = await prisma.gift.create({
        data: {
            name: giftName,
            userId: ownerUserId,
            description,
            url,
            order: users.length + 1,
            isSuggestedGift
        }
    });

    return user;
};

export const updateGift = async (gift: Gift): Promise<Gift> => {
    var gift = await prisma.gift.update({
        where: {
            id: gift.id
        },
        data: gift
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
            data: gift
        });
        updatedGifts.push(updatedGift);
    }

    return updatedGifts;
};

export const upsertGift = async (gift: Gift): Promise<Gift> => {
    var user = await prisma.gift.upsert({
        where: {
            id: gift.id
        },
        create: { ...gift, id: undefined },
        update: gift
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
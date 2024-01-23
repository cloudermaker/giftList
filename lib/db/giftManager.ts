import { Gift } from '@prisma/client';
import prisma from './dbSingleton';

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

export const updateManyGifts = async (
    id: string,
    name: string,
    description: string,
    url: string,
    order: number,
    isSuggestedGift = false
): Promise<boolean> => {
    var batch = await prisma.gift.updateMany({
        where: {
            id
        },
        data: { name, description, url, order, isSuggestedGift }
    });

    return batch.count > 0;
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

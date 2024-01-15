import { Gift } from '@prisma/client';
import prisma from './dbSingleton';

export const getGifts = async (): Promise<Gift[]> => {
    var gifts = await prisma.gift.findMany();

    return gifts;
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

export const updateGift = async (
    id: string,
    name: string,
    description: string,
    url: string,
    order: number,
    isSuggestedGift = false
): Promise<Gift> => {
    var user = await prisma.gift.update({
        where: {
            id
        },
        data: { name, description, url, order, isSuggestedGift }
    });

    return user;
};

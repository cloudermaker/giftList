import { Gift } from '@prisma/client';
import prisma from './dbSingleton';

export const getGifts = async (): Promise<Gift[]> => {
    var gifts = await prisma.gift.findMany();

    return gifts;
};

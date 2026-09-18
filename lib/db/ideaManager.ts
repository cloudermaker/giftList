import { Idea } from '@prisma/client';
import prisma from './dbSingleton';

export const getIdeas = async (): Promise<Idea[]> => {
    return prisma.idea.findMany({
        orderBy: [{ likes: 'desc' }, { createdAt: 'desc' }]
    });
};

export const createIdea = async (title: string, description?: string | null): Promise<Idea> => {
    return prisma.idea.create({
        data: {
            title: title.trim(),
            description: description?.trim() || null
        }
    });
};

// delta +1 (vote) ou -1 (retrait) ; le compteur ne descend jamais sous 0
export const voteIdea = async (ideaId: string, delta: 1 | -1): Promise<Idea | null> => {
    if (delta === -1) {
        const { count } = await prisma.idea.updateMany({
            where: { id: ideaId, likes: { gt: 0 } },
            data: { likes: { decrement: 1 } }
        });
        if (count === 0) return prisma.idea.findUnique({ where: { id: ideaId } });
    } else {
        await prisma.idea.update({ where: { id: ideaId }, data: { likes: { increment: 1 } } });
    }
    return prisma.idea.findUnique({ where: { id: ideaId } });
};

export const updateIdea = async (ideaId: string, data: { title?: string; description?: string | null }): Promise<Idea> => {
    return prisma.idea.update({
        where: { id: ideaId },
        data: {
            ...(data.title !== undefined && { title: data.title.trim() }),
            ...(data.description !== undefined && { description: data.description?.trim() || null })
        }
    });
};

export const setIdeaDone = async (ideaId: string, done: boolean): Promise<Idea> => {
    return prisma.idea.update({
        where: { id: ideaId },
        data: { doneAt: done ? new Date() : null }
    });
};

export const deleteIdea = async (ideaId: string): Promise<void> => {
    await prisma.idea.delete({ where: { id: ideaId } });
};

import { PrismaClient } from '@prisma/client';

// Les colonnes email ne sortent jamais par défaut : une requête doit les demander explicitement (omit: { email: false })
const prismaClientSingleton = () => {
    return new PrismaClient({
        omit: { user: { email: true, emailVerifiedAt: true, emailIsAdminKey: true } }
    });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

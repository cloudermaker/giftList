import { createHash, randomBytes } from 'crypto';
import prisma from '@/lib/db/dbSingleton';

export type TTokenPurpose = 'LOGIN' | 'VERIFY_EMAIL';

const TTL_MS: Record<TTokenPurpose, number> = {
    LOGIN: 30 * 60 * 1000,
    VERIFY_EMAIL: 24 * 60 * 60 * 1000
};

export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

// Le jeton brut ne part que dans l'email ; la base ne garde que son hash
export const createLoginToken = async ({
    purpose,
    email,
    userId,
    grantsAdmin = false
}: {
    purpose: TTokenPurpose;
    email: string;
    userId?: string;
    grantsAdmin?: boolean;
}): Promise<string> => {
    const token = randomBytes(32).toString('base64url');
    await prisma.loginToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await prisma.loginToken.create({
        data: {
            tokenHash: hashToken(token),
            purpose,
            email: normalizeEmail(email),
            userId: userId ?? null,
            grantsAdmin,
            expiresAt: new Date(Date.now() + TTL_MS[purpose])
        }
    });
    return token;
};

// Lecture sans consommer (affichage de la page de choix du profil)
export const findValidToken = async (token: string, purpose: TTokenPurpose) => {
    const row = await prisma.loginToken.findUnique({ where: { tokenHash: hashToken(token) } });
    if (!row || row.purpose !== purpose || row.usedAt || row.expiresAt < new Date()) return null;
    return row;
};

// Consommation atomique : un seul appel peut réussir pour un même jeton
export const consumeToken = async (token: string, purpose: TTokenPurpose) => {
    const row = await findValidToken(token, purpose);
    if (!row) return null;
    const { count } = await prisma.loginToken.updateMany({
        where: { id: row.id, usedAt: null },
        data: { usedAt: new Date() }
    });
    return count === 1 ? row : null;
};

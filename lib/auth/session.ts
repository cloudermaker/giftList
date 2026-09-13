import { createHmac, timingSafeEqual } from 'crypto';
import type { NextApiRequest } from 'next';
import { TGroupAndUser } from '@/pages/api/authenticate';
import { COOKIE_NAME } from './authService';

export const SESSION_MAX_AGE = 60 * 60 * 24 * 400; // 400 jours, comme l'ancien cookie js-cookie

const getSecret = (): string => {
    const secret = process.env.SESSION_SECRET;
    if (!secret && process.env.NODE_ENV === 'production') {
        console.warn('SESSION_SECRET is not set — session cookies are signed with the default dev secret.');
    }
    return secret || 'malistedecadeaux-dev-secret';
};

const hmac = (payload: string): string => createHmac('sha256', getSecret()).update(payload).digest('base64url');

// Format du cookie : base64url(json) + '.' + base64url(hmac-sha256)
export const signSession = (session: TGroupAndUser): string => {
    const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
    return `${payload}.${hmac(payload)}`;
};

export const verifySession = (cookieValue?: string): TGroupAndUser | null => {
    if (!cookieValue) return null;
    try {
        const [payload, signature] = decodeURIComponent(cookieValue).split('.');
        if (!payload || !signature) return null;
        const expected = Buffer.from(hmac(payload));
        const received = Buffer.from(signature);
        if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
        return JSON.parse(Buffer.from(payload, 'base64url').toString()) as TGroupAndUser;
    } catch {
        return null;
    }
};

export const sessionCookieHeader = (session: TGroupAndUser): string =>
    `${COOKIE_NAME}=${signSession(session)}; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Strict`;

// Session vérifiée depuis la requête API (null si absente, non signée ou falsifiée)
export const getSession = (req: NextApiRequest): TGroupAndUser | null => verifySession(req.cookies[COOKIE_NAME]);

export const isBackofficeSession = (req: NextApiRequest): boolean => req.cookies['backoffice_session'] === '1';

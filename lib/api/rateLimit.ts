import type { NextApiRequest } from 'next';

// Rate limit simple en mémoire (par instance lambda) — même approche que le formulaire de contact
export const createRateLimiter = (max: number, windowMs: number) => {
    const hits = new Map<string, number[]>();

    return (req: NextApiRequest): boolean => {
        const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
        if (recent.length >= max) return true;
        recent.push(now);
        hits.set(ip, recent);
        return false;
    };
};

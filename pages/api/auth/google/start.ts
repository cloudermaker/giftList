import type { NextApiRequest, NextApiResponse } from 'next';
import { randomBytes } from 'crypto';
import { getSession, signPayload } from '@/lib/auth/session';
import { GOOGLE_STATE_COOKIE, googleAuthorizeUrl, isGoogleConfigured, TGoogleState } from '@/lib/auth/google';

// ?intent=login (page de connexion) ou ?intent=attach (lier Google au profil connecté)
export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!isGoogleConfigured()) return res.status(503).json({ success: false, error: 'Connexion Google indisponible.' });

    const intent = req.query.intent === 'attach' ? 'attach' : 'login';
    const session = getSession(req);
    if (intent === 'attach' && !session) return res.redirect(302, '/');

    const value: TGoogleState = {
        state: randomBytes(16).toString('base64url'),
        intent,
        ...(intent === 'attach' && session
            ? { userId: session.userId, isAdmin: session.isAdmin, emailAuth: !!session.emailAuth }
            : {}),
        exp: Date.now() + 10 * 60 * 1000
    };
    // Lax : ce cookie doit revenir sur le callback, qui arrive depuis google.com
    res.setHeader(
        'Set-Cookie',
        `${GOOGLE_STATE_COOKIE}=${signPayload(value)}; Path=/api/auth/google; Max-Age=600; HttpOnly; SameSite=Lax${
            process.env.NODE_ENV === 'production' ? '; Secure' : ''
        }`
    );
    return res.redirect(302, googleAuthorizeUrl(value.state));
}

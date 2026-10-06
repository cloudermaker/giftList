import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyPayload } from '@/lib/auth/session';
import { createLoginToken } from '@/lib/auth/loginToken';
import { getEmailStatus, setVerifiedEmail } from '@/lib/auth/emailRecovery';
import { fetchGoogleEmail, GOOGLE_STATE_COOKIE, TGoogleState } from '@/lib/auth/google';

// Navigation relancée depuis notre propre page : le cookie de session Strict est bien envoyé ensuite
const sameSiteRedirect = (res: NextApiResponse, path: string) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(
        `<!doctype html><meta http-equiv="refresh" content="0;url=${path}"><script>location.replace(${JSON.stringify(path)})</script>`
    );
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Set-Cookie', `${GOOGLE_STATE_COOKIE}=; Path=/api/auth/google; Max-Age=0; HttpOnly; SameSite=Lax`);

    const saved = verifyPayload<TGoogleState>(req.cookies[GOOGLE_STATE_COOKIE]);
    const code = typeof req.query.code === 'string' ? req.query.code : null;
    if (!saved || saved.exp < Date.now() || req.query.state !== saved.state || !code) {
        return sameSiteRedirect(res, '/acces?erreur=google');
    }

    try {
        const email = await fetchGoogleEmail(code);
        if (!email) return sameSiteRedirect(res, '/acces?erreur=google');

        if (saved.intent === 'attach' && saved.userId) {
            const { verified } = await getEmailStatus(saved.userId);
            if (verified && !saved.emailAuth) return sameSiteRedirect(res, '/profil?email=verrouille');
            // Google a déjà vérifié l'adresse : pas d'email de confirmation
            await setVerifiedEmail(saved.userId, email, !!saved.isAdmin);
            return sameSiteRedirect(res, '/profil?email=google');
        }

        // Connexion : même page de choix du profil que le lien email
        const token = await createLoginToken({ purpose: 'LOGIN', email });
        return sameSiteRedirect(res, `/acces/${token}`);
    } catch (e) {
        console.error('Error in /api/auth/google/callback:', e);
        return sameSiteRedirect(res, '/acces?erreur=google');
    }
}

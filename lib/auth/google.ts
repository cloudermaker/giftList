import { SITE_URL } from '@/lib/email/mailer';

export const GOOGLE_STATE_COOKIE = 'google_oauth';

export type TGoogleState = {
    state: string;
    intent: 'login' | 'attach';
    // Intention « attach » : le profil connecté au départ (le cookie de session Strict n'arrive pas au callback)
    userId?: string;
    isAdmin?: boolean;
    emailAuth?: boolean;
    exp: number;
};

export const isGoogleConfigured = (): boolean => !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

const redirectUri = (): string => `${SITE_URL}/api/auth/google/callback`;

export const googleAuthorizeUrl = (state: string): string => {
    const params = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? '',
        redirect_uri: redirectUri(),
        response_type: 'code',
        scope: 'openid email',
        state,
        prompt: 'select_account'
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};

// Échange du code contre l'id_token ; reçu directement de Google en HTTPS, ses claims sont fiables sans vérifier la signature
export const fetchGoogleEmail = async (code: string): Promise<string | null> => {
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID ?? '',
            client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
            redirect_uri: redirectUri(),
            grant_type: 'authorization_code'
        })
    });
    if (!res.ok) return null;
    const { id_token: idToken } = (await res.json()) as { id_token?: string };
    if (!idToken) return null;

    const claims = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString()) as {
        aud?: string;
        iss?: string;
        email?: string;
        email_verified?: boolean;
    };
    const issuerOk = claims.iss === 'https://accounts.google.com' || claims.iss === 'accounts.google.com';
    if (claims.aud !== process.env.GOOGLE_CLIENT_ID || !issuerOk || !claims.email || claims.email_verified !== true) {
        return null;
    }
    return claims.email;
};

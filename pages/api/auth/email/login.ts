import type { NextApiRequest, NextApiResponse } from 'next';
import { parseBody, emailLoginSchema } from '@/lib/api/validation';
import { consumeToken } from '@/lib/auth/loginToken';
import { getProfilesByVerifiedEmail, sessionForProfile } from '@/lib/auth/emailRecovery';
import { sessionCookieHeader } from '@/lib/auth/session';
import { touchGroupActivity } from '@/lib/db/groupManager';

// Connexion depuis la page de choix du profil (/acces/[token]) : consomme le lien et ouvre la session
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
    const body = parseBody(emailLoginSchema, req, res);
    if (!body) return;

    try {
        const row = await consumeToken(body.token, 'LOGIN');
        if (!row) {
            return res
                .status(410)
                .json({ success: false, error: 'Ce lien a expiré ou a déjà été utilisé. Demande-en un nouveau.' });
        }
        const profile = (await getProfilesByVerifiedEmail(row.email)).find((p) => p.userId === body.userId);
        if (!profile) {
            return res.status(403).json({ success: false, error: "Ce profil n'est pas lié à cette adresse." });
        }
        await touchGroupActivity(profile.groupId);
        const groupUser = sessionForProfile(profile);
        res.setHeader('Set-Cookie', sessionCookieHeader(groupUser));
        return res.status(200).json({ success: true, groupUser });
    } catch (e) {
        console.error('Error in /api/auth/email/login:', e);
        return res.status(500).json({ success: false, error: 'Erreur interne' });
    }
}

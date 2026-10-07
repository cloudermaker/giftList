import type { NextApiRequest, NextApiResponse } from 'next';
import { parseBody, switchProfileSchema } from '@/lib/api/validation';
import { getSession, sessionCookieHeader } from '@/lib/auth/session';
import { getEmailStatus, getProfilesByVerifiedEmail, sessionForProfile } from '@/lib/auth/emailRecovery';
import { touchGroupActivity } from '@/lib/db/groupManager';

// Passage à un autre groupe lié au même email (réservé aux sessions ouvertes par email ou Google)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
    const session = getSession(req);
    if (!session?.emailAuth) return res.status(403).json({ success: false, error: 'Connexion par email requise.' });
    const body = parseBody(switchProfileSchema, req, res);
    if (!body) return;

    try {
        const { email } = await getEmailStatus(session.userId);
        const profile = email ? (await getProfilesByVerifiedEmail(email)).find((p) => p.userId === body.userId) : undefined;
        if (!profile) return res.status(403).json({ success: false, error: "Ce profil n'est pas lié à ton email." });

        await touchGroupActivity(profile.groupId);
        const groupUser = sessionForProfile(profile);
        res.setHeader('Set-Cookie', sessionCookieHeader(groupUser));
        return res.status(200).json({ success: true, groupUser });
    } catch (e) {
        console.error('Error in /api/auth/switch:', e);
        return res.status(500).json({ success: false, error: 'Erreur interne' });
    }
}

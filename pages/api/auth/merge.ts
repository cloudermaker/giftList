import type { NextApiRequest, NextApiResponse } from 'next';
import { parseBody, mergeProfileSchema } from '@/lib/api/validation';
import { getSession } from '@/lib/auth/session';
import { getEmailStatus, getProfilesByVerifiedEmail } from '@/lib/auth/emailRecovery';
import { MergeError, mergeUsers } from '@/lib/db/userManager';

// Fusion d'un autre profil lié au même email dans le profil courant (réservé aux sessions ouvertes par le lien email)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
    const session = getSession(req);
    if (!session?.emailAuth) return res.status(403).json({ success: false, error: 'Connexion par email requise.' });
    const body = parseBody(mergeProfileSchema, req, res);
    if (!body) return;

    try {
        const { email } = await getEmailStatus(session.userId);
        const linked =
            email && body.userId !== session.userId
                ? (await getProfilesByVerifiedEmail(email)).some((p) => p.userId === body.userId)
                : false;
        if (!linked) return res.status(403).json({ success: false, error: "Ce profil n'est pas lié à ton email." });

        await mergeUsers(session.userId, body.userId);
        return res.status(200).json({ success: true });
    } catch (e) {
        if (e instanceof MergeError) return res.status(409).json({ success: false, error: e.message });
        console.error('Error in /api/auth/merge:', e);
        return res.status(500).json({ success: false, error: 'Erreur interne' });
    }
}

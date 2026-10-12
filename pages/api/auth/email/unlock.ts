import type { NextApiRequest, NextApiResponse } from 'next';
import { createRateLimiter } from '@/lib/api/rateLimit';
import { getSession } from '@/lib/auth/session';
import { getEmailStatus, sendLoginLink } from '@/lib/auth/emailRecovery';

const isRateLimited = createRateLimiter(3, 60 * 60 * 1000);

// Profil connecté par prénom avec un email confirmé : envoie un lien à cette adresse pour pouvoir la modifier
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
    const session = getSession(req);
    if (!session) return res.status(401).json({ success: false, error: 'Non connecté' });
    if (isRateLimited(req)) {
        return res.status(429).json({ success: false, error: 'Trop de demandes. Réessaie dans une heure.' });
    }

    try {
        const { email, verified } = await getEmailStatus(session.userId);
        if (!email || !verified) return res.status(400).json({ success: false, error: 'Aucun email confirmé sur ce profil.' });
        await sendLoginLink(email, true);
        return res.status(200).json({ success: true });
    } catch (e) {
        console.error('Error in /api/auth/email/unlock:', e);
        return res.status(500).json({ success: false, error: "Impossible d'envoyer l'email pour le moment." });
    }
}

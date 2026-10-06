import type { NextApiRequest, NextApiResponse } from 'next';
import { parseBody, emailSchema } from '@/lib/api/validation';
import { createRateLimiter } from '@/lib/api/rateLimit';
import { sendLoginLink } from '@/lib/auth/emailRecovery';

const isRateLimited = createRateLimiter(5, 60 * 60 * 1000);

// « Accès oublié » : envoie un lien de connexion si l'email est lié à au moins un profil
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
    if (isRateLimited(req)) {
        return res.status(429).json({ success: false, error: 'Trop de demandes. Réessaie dans une heure.' });
    }
    const body = parseBody(emailSchema, req, res);
    if (!body) return;

    try {
        await sendLoginLink(body.email);
    } catch (e) {
        // Même réponse qu'en cas de succès : ne pas révéler si l'adresse est connue
        console.error('Error in /api/auth/email/request:', e);
    }
    return res.status(200).json({ success: true });
}

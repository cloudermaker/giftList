import type { NextApiRequest, NextApiResponse } from 'next';
import { parseBody, emailSchema } from '@/lib/api/validation';
import { createRateLimiter } from '@/lib/api/rateLimit';
import { getSession } from '@/lib/auth/session';
import { canChangeEmail, clearEmail, sendVerificationEmail } from '@/lib/auth/emailRecovery';

const isRateLimited = createRateLimiter(5, 60 * 60 * 1000);

const LOCKED_ERROR =
    "Pour modifier ton email, reconnecte-toi d'abord avec le lien envoyé à ton adresse actuelle (ou avec Google).";

// POST : lier un email au profil connecté (envoi d'un lien de confirmation) — DELETE : retirer l'email
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = getSession(req);
    if (!session) return res.status(401).json({ success: false, error: 'Non connecté' });

    try {
        if (req.method === 'POST') {
            if (isRateLimited(req)) {
                return res.status(429).json({ success: false, error: 'Trop de demandes. Réessaie dans une heure.' });
            }
            const body = parseBody(emailSchema, req, res);
            if (!body) return;
            if (!(await canChangeEmail(session))) return res.status(403).json({ success: false, error: LOCKED_ERROR });

            await sendVerificationEmail({
                userId: session.userId,
                userName: session.userName,
                groupName: session.groupName,
                email: body.email,
                grantsAdmin: session.isAdmin
            });
            return res.status(200).json({ success: true });
        }

        if (req.method === 'DELETE') {
            if (!(await canChangeEmail(session))) return res.status(403).json({ success: false, error: LOCKED_ERROR });
            await clearEmail(session.userId);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (e) {
        console.error('Error in /api/auth/email:', e);
        return res.status(500).json({ success: false, error: "Impossible d'envoyer l'email pour le moment." });
    }
}

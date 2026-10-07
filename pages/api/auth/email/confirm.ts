import type { NextApiRequest, NextApiResponse } from 'next';
import { parseBody, emailTokenSchema } from '@/lib/api/validation';
import { consumeToken } from '@/lib/auth/loginToken';
import { setVerifiedEmail } from '@/lib/auth/emailRecovery';

// Confirmation d'adresse depuis la page /email/confirmer/[token] (clic requis : les antivirus de messagerie ouvrent les liens)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
    const body = parseBody(emailTokenSchema, req, res);
    if (!body) return;

    try {
        const row = await consumeToken(body.token, 'VERIFY_EMAIL');
        if (!row || !row.userId) {
            return res.status(410).json({ success: false, error: 'Ce lien a expiré ou a déjà été utilisé.' });
        }
        await setVerifiedEmail(row.userId, row.email, row.grantsAdmin);
        return res.status(200).json({ success: true });
    } catch (e) {
        console.error('Error in /api/auth/email/confirm:', e);
        return res.status(500).json({ success: false, error: 'Erreur interne' });
    }
}

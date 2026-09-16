import type { NextApiRequest, NextApiResponse } from 'next';
import { voteIdea } from '@/lib/db/ideaManager';
import { createRateLimiter } from '@/lib/api/rateLimit';

// 30 votes / heure / IP (la déduplication par idée est côté navigateur)
const isRateLimited = createRateLimiter(30, 60 * 60 * 1000);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const id = req.query.id?.toString();
        if (!id) {
            return res.status(400).json({ success: false, error: 'Idea ID required' });
        }

        if (req.method !== 'POST' && req.method !== 'DELETE') {
            return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        if (isRateLimited(req)) {
            return res.status(429).json({ success: false, error: 'Trop de votes. Réessayez plus tard.' });
        }

        const idea = await voteIdea(id, req.method === 'POST' ? 1 : -1);
        if (!idea) {
            return res.status(404).json({ success: false, error: 'Idée introuvable' });
        }

        return res.status(200).json({ success: true, idea });
    } catch (e) {
        console.error('Error in /api/idea/[id]/vote:', e);
        return res.status(500).json({ success: false, error: 'Erreur interne' });
    }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { Idea } from '@prisma/client';
import { getIdeas, createIdea } from '@/lib/db/ideaManager';
import { parseBody, ideaCreateSchema } from '@/lib/api/validation';
import { createRateLimiter } from '@/lib/api/rateLimit';

export type TIdeaApiResult = {
    success: boolean;
    idea?: Idea;
    ideas?: Idea[];
    error?: string;
};

// 5 propositions / heure / IP
const isRateLimited = createRateLimiter(5, 60 * 60 * 1000);

export default async function handler(req: NextApiRequest, res: NextApiResponse<TIdeaApiResult>) {
    try {
        if (req.method === 'GET') {
            const ideas = await getIdeas();
            return res.status(200).json({ success: true, ideas });
        }

        if (req.method === 'POST') {
            const parsed = parseBody(ideaCreateSchema, req, res);
            if (!parsed) return;

            if (isRateLimited(req)) {
                return res.status(429).json({ success: false, error: "Trop d'idées envoyées. Réessayez plus tard." });
            }

            const idea = await createIdea(parsed.title, parsed.description);
            return res.status(201).json({ success: true, idea });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (e) {
        console.error('Error in /api/idea:', e);
        return res.status(500).json({ success: false, error: 'Erreur interne' });
    }
}

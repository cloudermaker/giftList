import type { NextApiRequest, NextApiResponse } from 'next';
import { setIdeaDone, updateIdea, deleteIdea } from '@/lib/db/ideaManager';
import { isBackofficeSession } from '@/lib/auth/session';
import { ideaUpdateSchema, parseBody } from '@/lib/api/validation';

// Modération (marquer réalisée, modifier, supprimer) : backoffice uniquement
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const rawId = req.query.id;
        const id = (Array.isArray(rawId) ? rawId[0] : rawId)?.toString();
        if (!id) {
            return res.status(400).json({ success: false, error: 'Idea ID required' });
        }

        if (!isBackofficeSession(req)) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        if (req.method === 'PATCH') {
            const body = parseBody(ideaUpdateSchema, req, res);
            if (!body) return;
            let idea =
                body.title !== undefined || body.description !== undefined
                    ? await updateIdea(id, { title: body.title, description: body.description })
                    : null;
            if (body.done !== undefined) {
                idea = await setIdeaDone(id, body.done);
            }
            return res.status(200).json({ success: true, idea });
        }

        if (req.method === 'DELETE') {
            await deleteIdea(id);
            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });
    } catch (e) {
        console.error('Error in /api/idea/[id]:', e);
        return res.status(500).json({ success: false, error: 'Erreur interne' });
    }
}

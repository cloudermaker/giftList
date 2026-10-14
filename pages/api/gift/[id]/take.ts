/**
 * API Gift Take/Release - Réservation de cadeaux
 *
 * POST /api/gift/{id}/take - Réserver un cadeau
 * DELETE /api/gift/{id}/take - Libérer un cadeau réservé
 * PATCH /api/gift/{id}/take - Marquer une réservation comme achetée
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { takeGift, releaseGift, releaseOneTakenGift, setTakenGiftBought } from '../../../../lib/db/userTakenGiftManager';
import prisma from '../../../../lib/db/dbSingleton';
import { getSession } from '@/lib/auth/session';
import { parseBody, takeBoughtSchema } from '@/lib/api/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const { id } = req.query;

        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'Gift ID required' });
        }

        // Le user vient de la session signée : impossible de réserver/libérer au nom d'un autre
        const session = getSession(req);
        const userId = session?.userId;

        // POST - Réserver un cadeau
        if (req.method === 'POST') {
            if (!userId) {
                return res.status(401).json({ error: 'Authentification requise' });
            }

            try {
                const result = await takeGift(userId, id);

                return res.status(200).json({
                    success: true,
                    ...result
                });
            } catch (error: any) {
                if (error.message === 'Cannot take your own gift') {
                    return res.status(403).json({ error: error.message });
                }
                if (error.message === 'Gift not found') {
                    return res.status(404).json({ error: error.message });
                }
                throw error;
            }
        }

        // DELETE - Libérer un cadeau réservé
        if (req.method === 'DELETE') {
            const { takenGiftId } = req.body;

            if (!userId) {
                return res.status(401).json({ error: 'Authentification requise' });
            }

            // Pour les cadeaux UNLIMITED : supprimer une réservation spécifique par son id
            if (takenGiftId) {
                const row = await prisma.userTakenGift.findUnique({ where: { id: takenGiftId } });
                if (!row || row.userId !== userId) {
                    return res.status(403).json({ error: 'Forbidden' });
                }
                await releaseOneTakenGift(takenGiftId);
                return res.status(200).json({ success: true });
            }

            const result = await releaseGift(userId, id);

            return res.status(200).json({
                success: true,
                ...result
            });
        }

        // PATCH - Marquer une réservation comme achetée (réservant uniquement)
        if (req.method === 'PATCH') {
            const parsed = parseBody(takeBoughtSchema, req, res);
            if (!parsed) return;

            if (!userId) {
                return res.status(401).json({ error: 'Authentification requise' });
            }

            const row = await prisma.userTakenGift.findUnique({ where: { id: parsed.takenGiftId } });
            if (!row || row.userId !== userId || row.giftId !== id) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const updated = await setTakenGiftBought(parsed.takenGiftId, parsed.bought);
            return res.status(200).json({ success: true, boughtAt: updated.boughtAt });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Error in /api/gift/[id]/take:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

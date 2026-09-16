/**
 * API SubGifts - Gestion des sous-cadeaux
 * 
 * GET /api/gift/{id}/subgifts - Récupérer les sous-cadeaux d'un cadeau parent
 * POST /api/gift/{id}/subgifts - Créer un sous-cadeau
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSubGifts, createSubGift, getGiftFromId } from '../../../../lib/db/giftManager';
import { getSession, isBackofficeSession } from '@/lib/auth/session';
import { parseBody, subGiftSchema } from '@/lib/api/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Parent gift ID required' });
    }

    // GET - Récupérer les sous-cadeaux
    if (req.method === 'GET') {
      const subGifts = await getSubGifts(id);

      return res.status(200).json({ success: true, subGifts });
    }

    // POST - Créer un sous-cadeau (propriétaire de la liste, admin ou backoffice)
    if (req.method === 'POST') {
      const parsed = parseBody(subGiftSchema, req, res);
      if (!parsed) return;
      const { name, description, url } = parsed;

      const session = getSession(req);
      if (!isBackofficeSession(req)) {
        if (!session) {
          return res.status(401).json({ error: 'Authentification requise' });
        }
        if (!session.isAdmin) {
          const parent = await getGiftFromId(id);
          if (parent && parent.userId !== session.userId) {
            return res.status(403).json({ error: 'Forbidden' });
          }
        }
      }

      const subGift = await createSubGift(
        id,
        name.trim(),
        description?.trim(),
        url?.trim()
      );

      return res.status(201).json({
        success: true,
        subGift
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error: any) {
    if (error.message === 'Parent gift not found') {
      return res.status(404).json({ error: error.message });
    }

    console.error('Error in /api/gift/[id]/subgifts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

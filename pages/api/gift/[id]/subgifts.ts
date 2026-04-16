/**
 * API SubGifts - Gestion des sous-cadeaux
 * 
 * GET /api/gift/{id}/subgifts - Récupérer les sous-cadeaux d'un cadeau parent
 * POST /api/gift/{id}/subgifts - Créer un sous-cadeau
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSubGifts, createSubGift } from '../../../../lib/db/giftManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Parent gift ID required' });
    }

    // GET - Récupérer les sous-cadeaux
    if (req.method === 'GET') {
      const subGifts = await getSubGifts(id);

      return res.status(200).json({ subGifts });
    }

    // POST - Créer un sous-cadeau
    if (req.method === 'POST') {
      const { name, description, url } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'name required' });
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
    return res.status(500).json({ 
      error: 'Internal server error',
      details: String(error)
    });
  }
}

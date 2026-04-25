/**
 * API Gift Take/Release - Réservation de cadeaux
 * 
 * POST /api/gift/{id}/take - Réserver un cadeau
 * DELETE /api/gift/{id}/take - Libérer un cadeau réservé
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { takeGift, releaseGift } from '../../../../lib/db/userTakenGiftManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Gift ID required' });
    }

    // POST - Réserver un cadeau
    if (req.method === 'POST') {
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
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
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId required' });
      }

      const result = await releaseGift(userId, id);

      return res.status(200).json({
        success: true,
        ...result
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in /api/gift/[id]/take:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: String(error)
    });
  }
}

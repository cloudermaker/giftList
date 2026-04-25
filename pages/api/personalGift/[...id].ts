/**
 * API PersonalGift by ID - Opérations sur un cadeau personnel spécifique
 * 
 * GET /api/personalGift/{id} - Récupérer un cadeau personnel
 * PUT /api/personalGift/{id} - Modifier un cadeau personnel
 * DELETE /api/personalGift/{id} - Supprimer un cadeau personnel
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  getPersonalGiftById,
  updatePersonalGift,
  deletePersonalGift,
  isPersonalGiftOwner
} from '../../../lib/db/personalGiftManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Extraire l'ID depuis le catch-all route [...id]
    const rawId = req.query.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Gift ID required' });
    }

    // GET - Récupérer un cadeau personnel
    if (req.method === 'GET') {
      const gift = await getPersonalGiftById(id);

      if (!gift) {
        return res.status(404).json({ error: 'Gift not found' });
      }

      return res.status(200).json({ gift });
    }

    // PUT - Modifier un cadeau personnel
    if (req.method === 'PUT') {
      const { name, description, url, forUserId, userId } = req.body;

      // Vérification d'autorisation simplifiée
      // TODO: Ajouter vérification du userId connecté
      if (userId) {
        const isOwner = await isPersonalGiftOwner(id, userId);
        if (!isOwner) {
          return res.status(403).json({ error: 'Forbidden: not the owner' });
        }
      }

      const gift = await updatePersonalGift(id, {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(url !== undefined && { url: url?.trim() }),
        ...(forUserId !== undefined && { forUserId })
      });

      return res.status(200).json({
        success: true,
        gift
      });
    }

    // DELETE - Supprimer un cadeau personnel
    if (req.method === 'DELETE') {
      const { userId } = req.body;

      // Vérification d'autorisation
      if (userId) {
        const isOwner = await isPersonalGiftOwner(id, userId);
        if (!isOwner) {
          return res.status(403).json({ error: 'Forbidden: not the owner' });
        }
      }

      await deletePersonalGift(id);

      return res.status(200).json({
        success: true,
        message: 'Personal gift deleted'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in /api/personalGift/[id]:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: String(error)
    });
  }
}

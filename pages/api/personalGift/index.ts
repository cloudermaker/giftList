/**
 * API PersonalGift - CRUD pour les cadeaux personnels
 * 
 * GET /api/personalGift?userId={uuid}&groupId={uuid} - Récupérer les cadeaux personnels d'un user
 * GET /api/personalGift?groupId={uuid} - Récupérer tous les cadeaux personnels d'un groupe
 * POST /api/personalGift - Créer un cadeau personnel
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  createPersonalGift,
  getPersonalGiftsByUser,
  getPersonalGiftsByGroup,
  getPersonalGiftsForUser
} from '../../../lib/db/personalGiftManager';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET - Récupérer cadeaux personnels
    if (req.method === 'GET') {
      const { userId, groupId, forUserId } = req.query;

      // Cadeaux pour un user spécifique
      if (forUserId && typeof forUserId === 'string') {
        const gifts = await getPersonalGiftsForUser(
          forUserId,
          groupId as string | undefined
        );
        return res.status(200).json({ gifts });
      }

      // Cadeaux d'un user
      if (userId && typeof userId === 'string') {
        const gifts = await getPersonalGiftsByUser(
          userId,
          groupId as string | undefined
        );
        return res.status(200).json({ gifts });
      }

      // Tous les cadeaux d'un groupe
      if (groupId && typeof groupId === 'string') {
        const gifts = await getPersonalGiftsByGroup(groupId);
        return res.status(200).json({ gifts });
      }

      return res.status(400).json({ error: 'userId or groupId required' });
    }

    // POST - Créer un cadeau personnel
    if (req.method === 'POST') {
      const { name, description, url, userId, forUserId, groupId } = req.body;

      if (!name || !userId || !groupId) {
        return res.status(400).json({ error: 'name, userId and groupId required' });
      }

      const gift = await createPersonalGift({
        name: name.trim(),
        description: description?.trim(),
        url: url?.trim(),
        userId,
        forUserId,
        groupId
      });

      return res.status(201).json({
        success: true,
        gift
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in /api/personalGift:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: String(error)
    });
  }
}

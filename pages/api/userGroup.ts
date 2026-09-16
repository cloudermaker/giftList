/**
 * API UserGroup - Gestion des memberships multi-groupes
 * 
 * POST /api/userGroup - Ajouter un user à un groupe
 * DELETE /api/userGroup?userId={uuid}&groupId={uuid} - Retirer un user d'un groupe
 * GET /api/userGroup?userId={uuid} - Récupérer les groupes d'un user
 * GET /api/userGroup?groupId={uuid} - Récupérer les users d'un groupe
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { Role } from '@prisma/client';
import {
  getUserGroups,
  getGroupUsers,
  addUserToGroup,
  removeUserFromGroup,
  updateUserRole
} from '../../lib/db/userGroupManager';
import { getSession, isBackofficeSession } from '@/lib/auth/session';
import { parseBody, membershipSchema } from '@/lib/api/validation';

// Écritures (ajout, promotion, retrait) : backoffice, ou admin (session signée) du groupe visé
const canWriteMembership = (req: NextApiRequest, groupId: string): boolean => {
  if (isBackofficeSession(req)) return true;
  const session = getSession(req);
  return (session?.isAdmin ?? false) && session?.groupId === groupId;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // GET - Récupérer groupes ou users
    if (req.method === 'GET') {
      const { userId, groupId } = req.query;

      if (userId && typeof userId === 'string') {
        // Récupérer les groupes d'un user
        const groups = await getUserGroups(userId);
        return res.status(200).json({ groups });
      }

      if (groupId && typeof groupId === 'string') {
        // Récupérer les users d'un groupe
        const users = await getGroupUsers(groupId);
        return res.status(200).json({ users });
      }

      return res.status(400).json({ error: 'userId or groupId required' });
    }

    // POST - Ajouter un user à un groupe
    if (req.method === 'POST') {
      const parsed = parseBody(membershipSchema, req, res);
      if (!parsed) return;
      const { userId, groupId, role } = parsed;
      if (!canWriteMembership(req, groupId)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const membership = await addUserToGroup(
        userId, 
        groupId, 
        role as Role || 'MEMBER'
      );

      return res.status(201).json({
        success: true,
        membership
      });
    }

    // PATCH - Modifier le rôle d'un user dans un groupe
    if (req.method === 'PATCH') {
      const parsed = parseBody(membershipSchema, req, res);
      if (!parsed) return;
      const { userId, groupId, role } = parsed;
      if (!role) {
        return res.status(400).json({ error: 'userId, groupId and role required' });
      }
      if (!canWriteMembership(req, groupId)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const membership = await updateUserRole(userId, groupId, role as Role);

      return res.status(200).json({
        success: true,
        membership
      });
    }

    // DELETE - Retirer un user d'un groupe
    if (req.method === 'DELETE') {
      const { userId, groupId } = req.query;

      if (!userId || !groupId || typeof userId !== 'string' || typeof groupId !== 'string') {
        return res.status(400).json({ error: 'userId and groupId required' });
      }
      if (!canWriteMembership(req, groupId)) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await removeUserFromGroup(userId, groupId);

      return res.status(200).json({
        success: true,
        message: 'User removed from group'
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in /api/userGroup:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

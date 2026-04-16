import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📸 Snapshot de la base de données AVANT migration\n');
    
    // Statistiques générales
    const userCount = await prisma.user.count();
    const groupCount = await prisma.group.count();
    const giftCount = await prisma.gift.count();
    
    // Users avec groupes
    const usersWithGroups = await prisma.user.count({
      where: { groupId: { not: null } }
    });
    
    // Gifts réservés (takenUserId)
    const takenGifts = await prisma.gift.count({
      where: { takenUserId: { not: null } }
    });
    
    // Gifts personnels (userId = null)
    const personalGifts = await prisma.gift.count({
      where: { userId: null }
    });
    
    // Gifts suggérés
    const suggestedGifts = await prisma.gift.count({
      where: { isSuggestedGift: true }
    });
    
    // Détails des groupes
    const groups = await prisma.group.findMany({
      include: {
        users: true
      }
    });
    
    // Exemples de données
    const sampleUsers = await prisma.user.findMany({
      take: 5,
      include: {
        group: true,
        gifts: true,
        takenGifts: true
      }
    });
    
    const snapshot = {
      timestamp: new Date().toISOString(),
      counts: {
        users: userCount,
        groups: groupCount,
        gifts: giftCount,
        usersWithGroups,
        takenGifts,
        personalGifts,
        suggestedGifts
      },
      groups: groups.map(g => ({
        id: g.id,
        name: g.name,
        userCount: g.users.length
      })),
      sampleUsers: sampleUsers.map(u => ({
        id: u.id,
        name: u.name,
        groupId: u.groupId,
        groupName: u.group?.name,
        giftCount: u.gifts.length,
        takenGiftCount: u.takenGifts.length
      }))
    };
    
    console.log('📊 STATISTIQUES:', snapshot.counts);
    console.log('👥 GROUPES:', snapshot.groups);
    console.log('📋 ÉCHANTILLON USERS:', snapshot.sampleUsers);
    
    return res.status(200).json(snapshot);
    
  } catch (error) {
    console.error('❌ Erreur lors du snapshot:', error);
    return res.status(500).json({ error: String(error) });
  } finally {
    await prisma.$disconnect();
  }
}

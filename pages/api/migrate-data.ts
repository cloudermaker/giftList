/**
 * API pour exécuter la migration des données
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  
  if (password !== 'migration2026') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🚀 Démarrage de la migration des données...\n');

    // ========================================
    // ÉTAPE 1: Migrer User.groupId → UserGroupMapping
    // ========================================
    console.log('📊 ÉTAPE 1: Migration des relations User-Group...');
    
    const usersWithGroups = await prisma.user.findMany({
      where: { groupId: { not: null } },
      select: { id: true, groupId: true, isAdmin: true }
    });
    
    console.log(`   Trouvé ${usersWithGroups.length} users avec groupes`);
    
    let userGroupMappingCount = 0;
    for (const user of usersWithGroups) {
      try {
        await prisma.userGroupMapping.create({
          data: {
            userId: user.id,
            groupId: user.groupId!,
            role: user.isAdmin ? 'ADMIN' : 'MEMBER',
            joinedAt: new Date()
          }
        });
        userGroupMappingCount++;
      } catch (error: any) {
        if (error.code !== 'P2002') { // Ignore duplicate errors
          console.error(`   ⚠️ Erreur user ${user.id}:`, error.message);
        }
      }
    }
    
    console.log(`   ✅ Créé ${userGroupMappingCount} relations UserGroupMapping\n`);

    // ========================================
    // ÉTAPE 2: Migrer Gift.takenUserId → UserTakenGift
    // ========================================
    console.log('📊 ÉTAPE 2: Migration des réservations de cadeaux...');
    
    const takenGifts = await prisma.gift.findMany({
      where: { takenUserId: { not: null } },
      select: { id: true, takenUserId: true }
    });
    
    console.log(`   Trouvé ${takenGifts.length} cadeaux réservés`);
    
    let userTakenGiftCount = 0;
    for (const gift of takenGifts) {
      try {
        await prisma.userTakenGift.create({
          data: {
            userId: gift.takenUserId!,
            giftId: gift.id,
            takenAt: new Date()
          }
        });
        userTakenGiftCount++;
      } catch (error: any) {
        if (error.code !== 'P2002') {
          console.error(`   ⚠️ Erreur gift ${gift.id}:`, error.message);
        }
      }
    }
    
    console.log(`   ✅ Créé ${userTakenGiftCount} entrées UserTakenGift\n`);

    // ========================================
    // ÉTAPE 3: Migrer Gift (userId=null) → PersonalGift
    // ========================================
    console.log('📊 ÉTAPE 3: Migration des cadeaux personnels...');
    
    const personalGifts = await prisma.gift.findMany({
      where: { 
        userId: null,
        takenUserId: { not: null }
      },
      select: { 
        id: true, 
        name: true, 
        description: true, 
        url: true, 
        takenUserId: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    console.log(`   Trouvé ${personalGifts.length} cadeaux personnels`);
    
    let personalGiftCount = 0;
    const giftsToDelete: string[] = [];
    
    for (const gift of personalGifts) {
      // Récupérer le premier groupe de l'utilisateur
      const userGroup = await prisma.userGroupMapping.findFirst({
        where: { userId: gift.takenUserId! },
        select: { groupId: true }
      });
      
      if (userGroup) {
        try {
          await prisma.personalGift.create({
            data: {
              name: gift.name,
              description: gift.description,
              url: gift.url,
              userId: gift.takenUserId!,
              groupId: userGroup.groupId,
              createdAt: gift.createdAt || new Date(),
              updatedAt: gift.updatedAt || new Date()
            }
          });
          giftsToDelete.push(gift.id);
          personalGiftCount++;
        } catch (error: any) {
          console.error(`   ⚠️ Erreur gift "${gift.name}":`, error.message);
        }
      } else {
        console.warn(`   ⚠️ User ${gift.takenUserId} n'a pas de groupe, cadeau "${gift.name}" ignoré`);
      }
    }
    
    console.log(`   ✅ Créé ${personalGiftCount} PersonalGift\n`);

    // ========================================
    // ÉTAPE 4: Nettoyer les anciens Gift personnels
    // ========================================
    console.log('📊 ÉTAPE 4: Suppression des anciens cadeaux personnels de Gift...');
    
    if (giftsToDelete.length > 0) {
      const deleted = await prisma.gift.deleteMany({
        where: { id: { in: giftsToDelete } }
      });
      console.log(`   ✅ Supprimé ${deleted.count} anciens cadeaux personnels\n`);
    } else {
      console.log(`   ℹ️ Aucun cadeau à supprimer\n`);
    }

    // ========================================
    // VÉRIFICATIONS FINALES
    // ========================================
    console.log('🔍 Vérifications finales...');
    
    const stats = {
      users: await prisma.user.count(),
      groups: await prisma.group.count(),
      gifts: await prisma.gift.count(),
      userGroupMappings: await prisma.userGroupMapping.count(),
      userTakenGifts: await prisma.userTakenGift.count(),
      personalGifts: await prisma.personalGift.count(),
    };
    
    console.log('\n📈 Statistiques post-migration:');
    console.log(`   Users: ${stats.users}`);
    console.log(`   Groups: ${stats.groups}`);
    console.log(`   Gifts: ${stats.gifts}`);
    console.log(`   UserGroupMappings: ${stats.userGroupMappings}`);
    console.log(`   UserTakenGifts: ${stats.userTakenGifts}`);
    console.log(`   PersonalGifts: ${stats.personalGifts}`);
    
    console.log('\n✅ Migration des données terminée avec succès!');
    
    return res.status(200).json({
      success: true,
      message: 'Data migration completed',
      stats,
      migrated: {
        userGroupMappings: userGroupMappingCount,
        userTakenGifts: userTakenGiftCount,
        personalGifts: personalGiftCount,
        deletedOldGifts: giftsToDelete.length
      }
    });
    
  } catch (error) {
    console.error('\n❌ Erreur durant la migration:', error);
    return res.status(500).json({ 
      success: false, 
      error: String(error) 
    });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Script pour documenter l'état actuel de la base de données
 * avant la migration vers le nouveau schéma.
 * 
 * Usage: node migration/snapshot_before.js
 */

// Charger les variables d'environnement
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function takeSnapshot() {
  console.log('📸 Snapshot de la base de données AVANT migration\n');
  console.log('='.repeat(60));
  
  try {
    // Statistiques générales
    const userCount = await prisma.user.count();
    const groupCount = await prisma.group.count();
    const giftCount = await prisma.gift.count();
    
    console.log('\n📊 STATISTIQUES GÉNÉRALES:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Groups: ${groupCount}`);
    console.log(`   Gifts: ${giftCount}`);
    
    // Users avec groupes
    const usersWithGroups = await prisma.user.count({
      where: { groupId: { not: null } }
    });
    console.log(`   Users avec groupId: ${usersWithGroups}`);
    
    // Gifts réservés (takenUserId)
    const takenGifts = await prisma.gift.count({
      where: { takenUserId: { not: null } }
    });
    console.log(`   Gifts réservés (takenUserId): ${takenGifts}`);
    
    // Gifts personnels (userId = null)
    const personalGifts = await prisma.gift.count({
      where: { userId: null }
    });
    console.log(`   Gifts personnels (userId=null): ${personalGifts}`);
    
    // Gifts suggérés
    const suggestedGifts = await prisma.gift.count({
      where: { isSuggestedGift: true }
    });
    console.log(`   Gifts suggérés: ${suggestedGifts}`);
    
    // Détails des groupes
    console.log('\n👥 DÉTAILS DES GROUPES:');
    const groups = await prisma.group.findMany({
      include: {
        users: true
      }
    });
    
    for (const group of groups) {
      console.log(`   - ${group.name} (${group.id})`);
      console.log(`     └─ ${group.users.length} membres`);
    }
    
    // Exemples de données
    console.log('\n📋 ÉCHANTILLON DE DONNÉES:');
    
    const sampleUsers = await prisma.user.findMany({
      take: 3,
      include: {
        group: true,
        gifts: true,
        takenGifts: true
      }
    });
    
    for (const user of sampleUsers) {
      console.log(`\n   User: ${user.name} (${user.id})`);
      console.log(`   └─ Groupe: ${user.group?.name || 'N/A'}`);
      console.log(`   └─ Cadeaux souhaités: ${user.gifts.length}`);
      console.log(`   └─ Cadeaux pris: ${user.takenGifts.length}`);
    }
    
    // Distribution des cadeaux par user
    console.log('\n🎁 DISTRIBUTION DES CADEAUX:');
    const usersWithGifts = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            gifts: true,
            takenGifts: true
          }
        }
      }
    });
    
    const totalWishlistGifts = usersWithGifts.reduce((sum, u) => sum + u._count.gifts, 0);
    const totalTakenGifts = usersWithGifts.reduce((sum, u) => sum + u._count.takenGifts, 0);
    
    console.log(`   Total cadeaux dans wishlists: ${totalWishlistGifts}`);
    console.log(`   Total réservations: ${totalTakenGifts}`);
    
    // Sauvegarder dans un fichier JSON
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
        giftCount: u.gifts.length,
        takenGiftCount: u.takenGifts.length
      }))
    };
    
    const fs = require('fs');
    const snapshotPath = './migration/snapshot_before.json';
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
    
    console.log(`\n✅ Snapshot sauvegardé dans: ${snapshotPath}`);
    console.log('\n' + '='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Erreur lors du snapshot:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  takeSnapshot()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { takeSnapshot };

/**
 * Script de migration des données pour la modernisation du schéma
 * 
 * Transformations:
 * 1. User.groupId → UserGroupMapping
 * 2. Gift (userId=null) → PersonalGift
 * 3. Gift.takenUserId → UserTakenGift
 * 4. Gift.giftType = SIMPLE pour tous les gifts existants
 * 
 * IMPORTANT: Ce script doit être exécuté PENDANT la migration Prisma
 * ou immédiatement après la création des nouvelles tables.
 * 
 * Usage:
 *   node migration/modernize_schema.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateData() {
  console.log('🚀 Démarrage de la migration des données...\n');

  try {
    // ========================================
    // ÉTAPE 1: Migrer User.groupId → UserGroupMapping
    // ========================================
    console.log('📊 ÉTAPE 1: Migration des relations User-Group...');
    
    const usersWithGroups = await prisma.$queryRaw`
      SELECT id, "groupId", "isAdmin" 
      FROM "User" 
      WHERE "groupId" IS NOT NULL
    `;
    
    console.log(`   Trouvé ${usersWithGroups.length} users avec groupes`);
    
    let userGroupMappingCount = 0;
    for (const user of usersWithGroups) {
      await prisma.$executeRaw`
        INSERT INTO "UserGroupMapping" (id, "userId", "groupId", role, "joinedAt")
        VALUES (
          gen_random_uuid(),
          ${user.id}::uuid,
          ${user.groupId}::uuid,
          ${user.isAdmin ? 'ADMIN' : 'MEMBER'}::"Role",
          NOW()
        )
        ON CONFLICT ("userId", "groupId") DO NOTHING
      `;
      userGroupMappingCount++;
    }
    
    console.log(`   ✅ Créé ${userGroupMappingCount} relations UserGroupMapping\n`);

    // ========================================
    // ÉTAPE 2: Migrer Gift.takenUserId → UserTakenGift
    // ========================================
    console.log('📊 ÉTAPE 2: Migration des réservations de cadeaux...');
    
    const takenGifts = await prisma.$queryRaw`
      SELECT id, "takenUserId"
      FROM "Gift"
      WHERE "takenUserId" IS NOT NULL
    `;
    
    console.log(`   Trouvé ${takenGifts.length} cadeaux réservés`);
    
    let userTakenGiftCount = 0;
    for (const gift of takenGifts) {
      await prisma.$executeRaw`
        INSERT INTO "UserTakenGift" (id, "userId", "giftId", "takenAt")
        VALUES (
          gen_random_uuid(),
          ${gift.takenUserId}::uuid,
          ${gift.id}::uuid,
          NOW()
        )
        ON CONFLICT ("userId", "giftId") DO NOTHING
      `;
      userTakenGiftCount++;
    }
    
    console.log(`   ✅ Créé ${userTakenGiftCount} entrées UserTakenGift\n`);

    // ========================================
    // ÉTAPE 3: Migrer Gift (userId=null) → PersonalGift
    // ========================================
    console.log('📊 ÉTAPE 3: Migration des cadeaux personnels...');
    
    const personalGifts = await prisma.$queryRaw`
      SELECT g.id, g.name, g.description, g.url, g."takenUserId", g."createdAt", g."updatedAt"
      FROM "Gift" g
      WHERE g."userId" IS NULL AND g."takenUserId" IS NOT NULL
    `;
    
    console.log(`   Trouvé ${personalGifts.length} cadeaux personnels`);
    
    // On doit trouver le groupId pour chaque cadeau personnel
    // En général, c'est le groupe de la personne qui l'a pris
    let personalGiftCount = 0;
    for (const gift of personalGifts) {
      // Récupérer le premier groupe de l'utilisateur qui a pris le cadeau
      const userGroup = await prisma.$queryRaw`
        SELECT "groupId"
        FROM "UserGroupMapping"
        WHERE "userId" = ${gift.takenUserId}::uuid
        LIMIT 1
      `;
      
      if (userGroup.length > 0) {
        await prisma.$executeRaw`
          INSERT INTO "PersonalGift" (id, name, description, url, "userId", "groupId", "createdAt", "updatedAt")
          VALUES (
            gen_random_uuid(),
            ${gift.name},
            ${gift.description},
            ${gift.url},
            ${gift.takenUserId}::uuid,
            ${userGroup[0].groupId}::uuid,
            ${gift.createdAt},
            ${gift.updatedAt}
          )
        `;
        personalGiftCount++;
      } else {
        console.warn(`   ⚠️ User ${gift.takenUserId} n'a pas de groupe, cadeau "${gift.name}" ignoré`);
      }
    }
    
    console.log(`   ✅ Créé ${personalGiftCount} PersonalGift\n`);

    // ========================================
    // ÉTAPE 4: Nettoyer les anciens Gift personnels
    // ========================================
    console.log('📊 ÉTAPE 4: Suppression des anciens cadeaux personnels de Gift...');
    
    const deletedGifts = await prisma.$executeRaw`
      DELETE FROM "Gift"
      WHERE "userId" IS NULL
    `;
    
    console.log(`   ✅ Supprimé ${deletedGifts} anciens cadeaux personnels\n`);

    // ========================================
    // ÉTAPE 5: Initialiser giftType pour tous les Gift existants
    // ========================================
    console.log('📊 ÉTAPE 5: Initialisation de giftType...');
    
    const updatedGifts = await prisma.$executeRaw`
      UPDATE "Gift"
      SET "giftType" = 'SIMPLE'::"GiftType"
      WHERE "giftType" IS NULL
    `;
    
    console.log(`   ✅ Initialisé ${updatedGifts} cadeaux avec giftType=SIMPLE\n`);

    // ========================================
    // VÉRIFICATIONS FINALES
    // ========================================
    console.log('🔍 Vérifications finales...');
    
    const stats = {
      users: await prisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`,
      groups: await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Group"`,
      gifts: await prisma.$queryRaw`SELECT COUNT(*) as count FROM "Gift"`,
      userGroupMappings: await prisma.$queryRaw`SELECT COUNT(*) as count FROM "UserGroupMapping"`,
      userTakenGifts: await prisma.$queryRaw`SELECT COUNT(*) as count FROM "UserTakenGift"`,
      personalGifts: await prisma.$queryRaw`SELECT COUNT(*) as count FROM "PersonalGift"`,
    };
    
    console.log('\n📈 Statistiques post-migration:');
    console.log(`   Users: ${stats.users[0].count}`);
    console.log(`   Groups: ${stats.groups[0].count}`);
    console.log(`   Gifts: ${stats.gifts[0].count}`);
    console.log(`   UserGroupMappings: ${stats.userGroupMappings[0].count}`);
    console.log(`   UserTakenGifts: ${stats.userTakenGifts[0].count}`);
    console.log(`   PersonalGifts: ${stats.personalGifts[0].count}`);
    
    console.log('\n✅ Migration terminée avec succès!');
    
  } catch (error) {
    console.error('\n❌ Erreur durant la migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
if (require.main === module) {
  migrateData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { migrateData };

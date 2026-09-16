/**
 * Backfill avant `prisma db push` du schéma P5 (contraintes non-null + unique).
 * À exécuter avec POSTGRES_PRISMA_URL pointant sur la base cible :
 *   node scripts/p5-backfill.js
 * Idempotent : ne touche que les valeurs NULL et signale les doublons bloquants.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
    // 1. Doublons de nom de groupe : bloquants pour @unique — à résoudre à la main si présents
    const dupes = await prisma.$queryRawUnsafe(
        `SELECT LOWER(name) AS lname, COUNT(*)::int AS n FROM "Group" GROUP BY LOWER(name) HAVING COUNT(*) > 1`
    );
    if (dupes.length > 0) {
        console.error('⚠️  Groupes en doublon (bloquant pour la contrainte unique) :', dupes);
        process.exit(1);
    }

    // 2. Backfill des NULL → valeurs par défaut
    const results = {};
    results.giftOrder = await prisma.$executeRawUnsafe(`UPDATE "Gift" SET "order" = 0 WHERE "order" IS NULL`);
    results.giftSuggested = await prisma.$executeRawUnsafe(`UPDATE "Gift" SET "isSuggestedGift" = false WHERE "isSuggestedGift" IS NULL`);
    for (const table of ['Group', 'User', 'Gift']) {
        results[`${table}.createdAt`] = await prisma.$executeRawUnsafe(`UPDATE "${table}" SET "createdAt" = NOW() WHERE "createdAt" IS NULL`);
        results[`${table}.updatedAt`] = await prisma.$executeRawUnsafe(`UPDATE "${table}" SET "updatedAt" = COALESCE("createdAt", NOW()) WHERE "updatedAt" IS NULL`);
    }
    results.groupPassword = await prisma.$executeRawUnsafe(`UPDATE "Group" SET "adminPassword" = 'admin' WHERE "adminPassword" IS NULL`);

    console.log('Backfill OK :', results);
    await prisma.$disconnect();
})().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});

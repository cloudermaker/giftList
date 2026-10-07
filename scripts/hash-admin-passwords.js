/**
 * Hache les mots de passe admin encore en clair (ceux des admins qui ne se sont pas reconnectés depuis la v5.6.0).
 * À exécuter avec POSTGRES_PRISMA_URL pointant sur la base cible, APRÈS le déploiement de la v5.6.0 :
 *   node scripts/hash-admin-passwords.js           → simulation : compte seulement
 *   node scripts/hash-admin-passwords.js --apply   → hache pour de bon
 * Idempotent : les empreintes existantes (scrypt$…) ne sont jamais retouchées. Même format que lib/auth/password.ts.
 */
const { PrismaClient } = require('@prisma/client');
const { randomBytes, scryptSync } = require('crypto');

const prisma = new PrismaClient();
const apply = process.argv.includes('--apply');

const hashPassword = (password) => {
    const salt = randomBytes(16);
    const hash = scryptSync(password, salt, 64);
    return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
};

(async () => {
    const groups = await prisma.group.findMany({
        where: { NOT: { adminPassword: { startsWith: 'scrypt$' } }, adminPassword: { not: '' } },
        select: { id: true, adminPassword: true }
    });
    console.log(`${groups.length} mot(s) de passe encore en clair.`);

    if (apply) {
        for (const g of groups) {
            await prisma.group.update({ where: { id: g.id }, data: { adminPassword: hashPassword(g.adminPassword) } });
        }
        console.log('Terminé : tous les mots de passe admin sont hachés.');
    } else if (groups.length > 0) {
        console.log('Simulation uniquement. Relancer avec --apply pour hacher.');
    }
    await prisma.$disconnect();
})().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});

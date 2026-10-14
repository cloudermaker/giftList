import { test, expect } from '@playwright/test';
import { uniqueName } from './fixtures';
import prisma from '../lib/db/dbSingleton';

/**
 * RGPD : mots de passe admin hachés, suppression complète d'un groupe, purge des groupes inactifs.
 */
const PASSWORD = 'mdp-retention-e2e';

const createGroupViaApi = async (request: import('@playwright/test').APIRequestContext, groupName: string) => {
    const res = await request.post('/api/authenticate', {
        data: { groupName, userName: 'Zoé', isCreating: true, password: PASSWORD }
    });
    const json = await res.json();
    expect(json.success).toBeTruthy();
    return json.groupUser as { groupId: string; userId: string };
};

const login = (request: import('@playwright/test').APIRequestContext, groupName: string, password: string) =>
    request.post('/api/authenticate', { data: { groupName, userName: 'Zoé', password } });

test.describe('Données personnelles', () => {
    test('le mot de passe admin est haché, y compris après un changement', async ({ request }) => {
        const groupName = uniqueName('e2e-rgpd');
        const { groupId } = await createGroupViaApi(request, groupName);

        const stored = await prisma.group.findUnique({ where: { id: groupId }, select: { adminPassword: true } });
        expect(stored?.adminPassword).toMatch(/^scrypt\$/);
        expect(stored?.adminPassword).not.toContain(PASSWORD);

        // Changement depuis le groupe (admin connecté) : toujours haché, et le nouveau mot de passe fonctionne
        expect(
            (await request.patch(`/api/group/${groupId}`, { data: { group: { adminPassword: 'nouveau-mdp' } } })).ok()
        ).toBeTruthy();
        expect((await prisma.group.findUnique({ where: { id: groupId } }))?.adminPassword).toMatch(/^scrypt\$/);
        expect((await login(request, groupName, 'nouveau-mdp')).ok()).toBeTruthy();
        expect((await login(request, groupName, PASSWORD)).status()).toBe(401);

        await login(request, groupName, 'nouveau-mdp');
        await request.delete(`/api/group/${groupId}`);
    });

    test('un ancien mot de passe en clair fonctionne puis est haché à la connexion', async ({ request }) => {
        const groupName = uniqueName('e2e-rgpd');
        const { groupId } = await createGroupViaApi(request, groupName);
        await prisma.group.update({ where: { id: groupId }, data: { adminPassword: 'ancien-en-clair' } });

        const res = await login(request, groupName, 'ancien-en-clair');
        expect((await res.json()).groupUser?.isAdmin).toBe(true);
        expect((await prisma.group.findUnique({ where: { id: groupId } }))?.adminPassword).toMatch(/^scrypt\$/);
        expect((await login(request, groupName, 'ancien-en-clair')).ok()).toBeTruthy();

        await request.delete(`/api/group/${groupId}`);
    });

    test('la tâche hebdomadaire hache les mots de passe admin restés en clair', async ({ request }) => {
        const groupName = uniqueName('e2e-rgpd');
        const { groupId } = await createGroupViaApi(request, groupName);
        await prisma.group.update({ where: { id: groupId }, data: { adminPassword: 'reste-en-clair' } });

        const run = await request.get('/api/cron/purge', { headers: { Authorization: 'Bearer e2e-cron-secret' } });
        expect(run.ok()).toBeTruthy();
        expect((await prisma.group.findUnique({ where: { id: groupId } }))?.adminPassword).toMatch(/^scrypt\$/);
        expect((await login(request, groupName, 'reste-en-clair')).ok()).toBeTruthy();

        await request.delete(`/api/group/${groupId}`);
    });

    test('supprimer un groupe supprime aussi ses membres et leurs listes', async ({ request }) => {
        const groupName = uniqueName('e2e-rgpd');
        const { groupId, userId } = await createGroupViaApi(request, groupName);
        await prisma.gift.create({ data: { name: 'Cadeau à effacer', userId } });

        expect((await request.delete(`/api/group/${groupId}`)).ok()).toBeTruthy();
        expect(await prisma.user.findUnique({ where: { id: userId } })).toBeNull();
        expect(await prisma.gift.count({ where: { userId } })).toBe(0);
    });

    test('la purge hebdomadaire supprime les cadeaux achetés depuis plus de 6 mois, et seulement eux', async ({ request }) => {
        const { groupId, userId: zoeId } = await createGroupViaApi(request, uniqueName('e2e-rgpd-achats'));
        const owner = await prisma.user.create({ data: { name: 'yann', groupMemberships: { create: { groupId } } } });
        const sevenMonthsAgo = new Date(Date.now() - 7 * 30 * 24 * 60 * 60 * 1000);
        const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const reserve = async (name: string, boughtAt: Date | null, giftType: 'SIMPLE' | 'UNLIMITED' = 'SIMPLE') => {
            const gift = await prisma.gift.create({ data: { name, userId: owner.id, giftType } });
            const row = await prisma.userTakenGift.create({ data: { userId: zoeId, giftId: gift.id, boughtAt } });
            return { giftId: gift.id, rowId: row.id };
        };
        const oldBought = await reserve('Offert il y a 7 mois', sevenMonthsAgo);
        const recentBought = await reserve('Offert le mois dernier', lastMonth);
        const notBought = await reserve('Réservé, pas acheté', null);
        const unlimited = await reserve('Illimité offert il y a 7 mois', sevenMonthsAgo, 'UNLIMITED');
        const oldPersonal = await prisma.personalGift.create({
            data: { name: 'Fleurs', userId: zoeId, groupId, boughtAt: sevenMonthsAgo }
        });
        const recentPersonal = await prisma.personalGift.create({
            data: { name: 'Chocolats', userId: zoeId, groupId, boughtAt: lastMonth }
        });

        const purge = await request.get('/api/cron/purge', { headers: { Authorization: 'Bearer e2e-cron-secret' } });
        expect(purge.ok()).toBeTruthy();

        // Cadeau simple offert il y a plus de 6 mois : retiré de la liste
        expect(await prisma.gift.findUnique({ where: { id: oldBought.giftId } })).toBeNull();
        // Illimité : seule la réservation part, le cadeau reste sur la liste
        expect(await prisma.gift.findUnique({ where: { id: unlimited.giftId } })).not.toBeNull();
        expect(await prisma.userTakenGift.findUnique({ where: { id: unlimited.rowId } })).toBeNull();
        // Récent ou pas encore acheté : intact
        expect(await prisma.userTakenGift.findUnique({ where: { id: recentBought.rowId } })).not.toBeNull();
        expect(await prisma.userTakenGift.findUnique({ where: { id: notBought.rowId } })).not.toBeNull();
        expect(await prisma.personalGift.findUnique({ where: { id: oldPersonal.id } })).toBeNull();
        expect(await prisma.personalGift.findUnique({ where: { id: recentPersonal.id } })).not.toBeNull();

        await request.delete(`/api/group/${groupId}`);
    });

    test('la purge hebdomadaire supprime les groupes inactifs depuis 3 ans, et seulement eux', async ({ request }) => {
        const oldGroup = await createGroupViaApi(request, uniqueName('e2e-rgpd-vieux'));
        const activeName = uniqueName('e2e-rgpd-actif');
        const activeGroup = await createGroupViaApi(request, activeName);

        const fourYearsAgo = new Date(Date.now() - 4 * 365 * 24 * 60 * 60 * 1000);
        await prisma.group.update({ where: { id: oldGroup.groupId }, data: { lastActivityAt: fourYearsAgo } });
        await prisma.group.update({ where: { id: activeGroup.groupId }, data: { lastActivityAt: fourYearsAgo } });

        // Une connexion remet le compteur à zéro
        await login(request, activeName, PASSWORD);
        const touched = await prisma.group.findUnique({ where: { id: activeGroup.groupId } });
        expect(touched!.lastActivityAt.getTime()).toBeGreaterThan(Date.now() - 60 * 60 * 1000);

        // Sans le secret Vercel Cron : refusé
        expect((await request.get('/api/cron/purge')).status()).toBe(401);
        const purge = await request.get('/api/cron/purge', { headers: { Authorization: 'Bearer e2e-cron-secret' } });
        expect(purge.ok()).toBeTruthy();

        expect(await prisma.group.findUnique({ where: { id: oldGroup.groupId } })).toBeNull();
        expect(await prisma.user.findUnique({ where: { id: oldGroup.userId } })).toBeNull();
        expect(await prisma.group.findUnique({ where: { id: activeGroup.groupId } })).not.toBeNull();

        await request.delete(`/api/group/${activeGroup.groupId}`);
    });
});

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

    test('supprimer un groupe supprime aussi ses membres et leurs listes', async ({ request }) => {
        const groupName = uniqueName('e2e-rgpd');
        const { groupId, userId } = await createGroupViaApi(request, groupName);
        await prisma.gift.create({ data: { name: 'Cadeau à effacer', userId } });

        expect((await request.delete(`/api/group/${groupId}`)).ok()).toBeTruthy();
        expect(await prisma.user.findUnique({ where: { id: userId } })).toBeNull();
        expect(await prisma.gift.count({ where: { userId } })).toBe(0);
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

import { test, expect } from '@playwright/test';
import { uniqueName, E2E_BASE_URL } from './fixtures';

/**
 * Régressions de sécurité : le cookie signé et les gardes d'autorisation
 * ajoutés en v5.2.0 ne doivent jamais réapparaître.
 */
test.describe('Sécurité', () => {
    // Crée un groupe via l'API : le contexte de requête garde le cookie signé renvoyé par Set-Cookie
    const createGroupViaApi = async (request: import('@playwright/test').APIRequestContext, groupName: string) => {
        const res = await request.post('/api/authenticate', {
            data: { groupName, userName: 'Secu', isCreating: true, password: 'e2e-password' }
        });
        expect(res.ok()).toBeTruthy();
        const json = await res.json();
        expect(json.success).toBeTruthy();
        return json.groupUser.groupId as string;
    };

    test('un cookie admin forgé (non signé) ne peut pas supprimer un groupe', async ({ request, playwright }) => {
        const groupId = await createGroupViaApi(request, uniqueName('e2e-secu'));

        const forgedPayload = Buffer.from(
            JSON.stringify({ groupId, groupName: 'x', userId: 'x', userName: 'x', isAdmin: true })
        ).toString('base64');
        const forged = await playwright.request.newContext({
            baseURL: E2E_BASE_URL,
            extraHTTPHeaders: { cookie: `currentUser=${forgedPayload}` }
        });

        const del = await forged.delete(`/api/group/${groupId}`);
        expect(del.status()).toBe(403);
        await forged.dispose();

        // Nettoyage avec la session légitime (signée)
        const legit = await request.delete(`/api/group/${groupId}`);
        expect(legit.ok()).toBeTruthy();
    });

    test('le mot de passe admin ne fuite ni dans l’API ni dans le HTML de la page groupe', async ({ request }) => {
        const groupId = await createGroupViaApi(request, uniqueName('e2e-secu'));

        const api = await request.get(`/api/group/${groupId}`);
        const apiBody = await api.text();
        expect(apiBody).not.toContain('adminPassword');
        expect(apiBody).not.toContain('e2e-password');

        // La page SSR du groupe (cookie signé du contexte) n'embarque pas le mot de passe
        const html = await (await request.get(`/group/${groupId}`)).text();
        expect(html).not.toContain('e2e-password');

        await request.delete(`/api/group/${groupId}`);
    });

    test('réserver un cadeau sans session renvoie 401', async ({ playwright }) => {
        const anon = await playwright.request.newContext({ baseURL: E2E_BASE_URL });
        const res = await anon.post('/api/gift/some-gift-id/take', { data: {} });
        expect(res.status()).toBe(401);
        await anon.dispose();
    });

    test('promouvoir un membre admin sans session renvoie 403', async ({ playwright }) => {
        const anon = await playwright.request.newContext({ baseURL: E2E_BASE_URL });
        const res = await anon.patch('/api/userGroup', { data: { userId: 'x', groupId: 'y', role: 'ADMIN' } });
        expect(res.status()).toBe(403);
        await anon.dispose();
    });

    test('un cookie ancien format (non signé) est traité comme déconnecté', async ({ browser }) => {
        const ctx = await browser.newContext();
        const legacy = Buffer.from(
            JSON.stringify({ groupId: 'x', groupName: 'x', userId: 'x', userName: 'x', isAdmin: true })
        ).toString('base64');
        await ctx.addCookies([{ name: 'currentUser', value: legacy, url: E2E_BASE_URL }]);

        const page = await ctx.newPage();
        await page.goto('/home');
        await page.waitForURL((url) => url.pathname === '/');
        await expect(page.locator('h1')).toHaveText('Liste de cadeaux en ligne gratuite');
        await ctx.close();
    });

    test('les cadeaux personnels ne sont lisibles que par leur créateur', async ({ request, playwright }) => {
        const groupId = await createGroupViaApi(request, uniqueName('e2e-secu'));
        const create = await request.post('/api/personalGift', { data: { personalGift: { name: 'Surprise', groupId } } });
        expect(create.status()).toBe(201);
        const giftId = (await create.json()).personalGift.id as string;

        // Créateur : voit son cadeau
        const own = await request.get(`/api/personalGift?groupId=${groupId}`);
        expect((await own.json()).gifts).toHaveLength(1);
        expect((await request.get(`/api/personalGift/${giftId}`)).status()).toBe(200);

        // Sans session : 401
        const anon = await playwright.request.newContext({ baseURL: E2E_BASE_URL });
        expect((await anon.get(`/api/personalGift?groupId=${groupId}`)).status()).toBe(401);
        expect((await anon.get(`/api/personalGift/${giftId}`)).status()).toBe(401);
        await anon.dispose();

        // Autre membre connecté : liste vide, fiche introuvable, userId d'un autre refusé
        const other = await playwright.request.newContext({ baseURL: E2E_BASE_URL });
        const otherGroup = await other.post('/api/authenticate', {
            data: { groupName: uniqueName('e2e-secu'), userName: 'Autre', isCreating: true, password: 'e2e-password' }
        });
        const otherJson = await otherGroup.json();
        expect((await (await other.get(`/api/personalGift?groupId=${groupId}`)).json()).gifts).toHaveLength(0);
        expect((await other.get(`/api/personalGift/${giftId}`)).status()).toBe(404);
        const ownerId = (await create.json()).personalGift.userId as string;
        expect((await other.get(`/api/personalGift?userId=${ownerId}`)).status()).toBe(403);

        await other.delete(`/api/group/${otherJson.groupUser.groupId}`);
        await other.dispose();
        expect((await request.delete(`/api/group/${groupId}`)).ok()).toBeTruthy();
    });
    test('un cookie backoffice forgé ne donne aucun droit', async ({ request, playwright }) => {
        const groupId = await createGroupViaApi(request, uniqueName('e2e-secu'));
        // Valeur « 1 » écrite à la main, ou session utilisateur signée recopiée dans le cookie backoffice
        const userToken = (await request.storageState()).cookies.find((c) => c.name === 'currentUser')!.value;
        for (const value of ['1', userToken]) {
            const forged = await playwright.request.newContext({
                baseURL: E2E_BASE_URL,
                extraHTTPHeaders: { cookie: `backoffice_session=${value}` }
            });
            expect((await forged.delete(`/api/group/${groupId}`)).status()).toBe(403);
            await forged.dispose();
        }
        expect((await request.delete(`/api/group/${groupId}`)).ok()).toBeTruthy();
    });

    test('les cadeaux d’une liste ne sont modifiables que par son groupe', async ({ playwright }) => {
        const newSession = async (label: string) => {
            const ctx = await playwright.request.newContext({ baseURL: E2E_BASE_URL });
            const res = await ctx.post('/api/authenticate', {
                data: { groupName: uniqueName(label), userName: 'Secu', isCreating: true, password: 'e2e-password' }
            });
            const { groupId, userId } = (await res.json()).groupUser;
            return { ctx, groupId: groupId as string, userId: userId as string };
        };
        const alice = await newSession('e2e-secu-a');
        const mallory = await newSession('e2e-secu-m'); // admin de SON groupe, étranger au groupe d'Alice

        const created = await alice.ctx.post('/api/gift', {
            data: { gift: { name: 'Cadeau Alice', userId: alice.userId, giftType: 'SIMPLE' }, userGiftId: alice.userId }
        });
        expect(created.ok()).toBeTruthy();
        const gift = (await created.json()).gift;

        // Lecture, création, édition (2 routes), réordonnancement, suppression : tout est refusé
        expect((await mallory.ctx.get(`/api/gift?giftId=${gift.id}`)).status()).toBe(403);
        expect((await mallory.ctx.get(`/api/gift/${gift.id}`)).status()).toBe(403);
        const intrusions = [
            mallory.ctx.post('/api/gift', { data: { gift: { name: 'Intrus', userId: alice.userId } } }),
            mallory.ctx.post('/api/gift', { data: { gift: { name: 'Intrus', isSuggestedGift: true, userId: alice.userId } } }),
            mallory.ctx.post('/api/gift', { data: { gift: { ...gift, name: 'Piraté', userId: mallory.userId } } }),
            mallory.ctx.patch(`/api/gift/${gift.id}`, { data: { gift: { name: 'Piraté' } } }),
            mallory.ctx.post('/api/gift', { data: { gifts: [{ ...gift, userId: mallory.userId, order: 9 }] } }),
            mallory.ctx.post(`/api/gift/${gift.id}/take`, { data: {} }),
            mallory.ctx.get(`/api/gift/${gift.id}/subgifts`),
            mallory.ctx.post(`/api/gift/${gift.id}/subgifts`, { data: { name: 'Intrus' } }),
            mallory.ctx.delete(`/api/gift/${gift.id}`)
        ];
        for (const res of await Promise.all(intrusions)) expect(res.status()).toBe(403);

        // Le cadeau est intact
        const after = (await (await alice.ctx.get(`/api/gift?giftId=${gift.id}`)).json()).gift;
        expect(after.name).toBe('Cadeau Alice');
        expect(after.order).toBe(gift.order);

        // Alice garde tous ses droits
        expect((await alice.ctx.patch(`/api/gift/${gift.id}`, { data: { gift: { name: 'Renommé' } } })).ok()).toBeTruthy();
        expect((await alice.ctx.post('/api/gift', { data: { gifts: [{ ...gift, order: 3 }] } })).ok()).toBeTruthy();
        expect((await alice.ctx.delete(`/api/gift/${gift.id}`)).ok()).toBeTruthy();

        for (const s of [alice, mallory]) {
            await s.ctx.delete(`/api/group/${s.groupId}`);
            await s.ctx.dispose();
        }
    });
});

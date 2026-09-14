import { test, expect } from '@playwright/test';
import { uniqueName } from './fixtures';

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
            baseURL: 'http://localhost:3000',
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
        const anon = await playwright.request.newContext({ baseURL: 'http://localhost:3000' });
        const res = await anon.post('/api/gift/some-gift-id/take', { data: {} });
        expect(res.status()).toBe(401);
        await anon.dispose();
    });

    test('promouvoir un membre admin sans session renvoie 403', async ({ playwright }) => {
        const anon = await playwright.request.newContext({ baseURL: 'http://localhost:3000' });
        const res = await anon.patch('/api/userGroup', { data: { userId: 'x', groupId: 'y', role: 'ADMIN' } });
        expect(res.status()).toBe(403);
        await anon.dispose();
    });

    test('un cookie ancien format (non signé) est traité comme déconnecté', async ({ browser }) => {
        const ctx = await browser.newContext();
        const legacy = Buffer.from(
            JSON.stringify({ groupId: 'x', groupName: 'x', userId: 'x', userName: 'x', isAdmin: true })
        ).toString('base64');
        await ctx.addCookies([{ name: 'currentUser', value: legacy, url: 'http://localhost:3000' }]);

        const page = await ctx.newPage();
        await page.goto('/home');
        await page.waitForURL((url) => url.pathname === '/');
        await expect(page.locator('h1')).toHaveText('Liste de cadeaux en ligne gratuite');
        await ctx.close();
    });
});

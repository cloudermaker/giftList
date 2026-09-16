import { test, expect, APIRequestContext } from '@playwright/test';
import { uniqueName } from './fixtures';

/**
 * Boîte à idées publique (/ideas) : proposition, vote, filtre "réalisées", modération backoffice.
 */
test.describe.serial('Boîte à idées', () => {
    let ideaTitle: string;
    let backofficeCtx: APIRequestContext;

    test.beforeAll(async ({ playwright }) => {
        ideaTitle = uniqueName('Idée e2e');
        // Contexte API authentifié backoffice (pour modérer et nettoyer)
        backofficeCtx = await playwright.request.newContext({ baseURL: 'http://localhost:3000' });
        const login = await backofficeCtx.post('/api/backoffice/auth', {
            data: { login: process.env.BACKOFFICE_USERNAME, pass: process.env.BACKOFFICE_PASSWORD }
        });
        expect(login.ok()).toBeTruthy();
    });

    test.afterAll(async () => {
        // Nettoyage : supprimer toutes les idées créées par les tests
        const res = await backofficeCtx.get('/api/idea');
        const ideas = (await res.json()).ideas ?? [];
        for (const idea of ideas.filter((i: { title: string }) => i.title.startsWith('Idée e2e') || i.title.startsWith('spam e2e'))) {
            await backofficeCtx.delete(`/api/idea/${idea.id}`);
        }
        await backofficeCtx.dispose();
    });

    test('un visiteur non connecté propose une idée puis vote et retire son vote', async ({ page }) => {
        await page.goto('/ideas');
        await expect(page.locator('h1')).toHaveText('Boîte à idées');

        await page.locator('#ideaTitleInput').fill(ideaTitle);
        await page.locator('#ideaDescriptionInput').fill('Une description de test');
        await page.getByRole('button', { name: 'Proposer mon idée' }).click();
        await expect(page.getByText('Merci ! Votre idée est en ligne.')).toBeVisible();

        const ideaRow = page.locator('.item', { hasText: ideaTitle });
        await expect(ideaRow).toBeVisible();
        await expect(ideaRow.getByRole('button', { name: 'Voter pour cette idée' })).toHaveText(/👍 0/);

        // Vote
        await ideaRow.getByRole('button', { name: 'Voter pour cette idée' }).click();
        await expect(ideaRow.getByRole('button', { name: 'Retirer mon vote' })).toHaveText(/👍 1/);

        // Le vote est mémorisé après rechargement (dédup par navigateur)
        await page.reload();
        const rowAfterReload = page.locator('.item', { hasText: ideaTitle });
        await expect(rowAfterReload.getByRole('button', { name: 'Retirer mon vote' })).toHaveText(/👍 1/);

        // Retrait du vote
        await rowAfterReload.getByRole('button', { name: 'Retirer mon vote' }).click();
        await expect(rowAfterReload.getByRole('button', { name: 'Voter pour cette idée' })).toHaveText(/👍 0/);
    });

    test('une idée réalisée est masquée par défaut et visible via le filtre', async ({ page }) => {
        // Marquer l'idée comme réalisée via le backoffice
        const list = await backofficeCtx.get('/api/idea');
        const idea = ((await list.json()).ideas ?? []).find((i: { title: string }) => i.title === ideaTitle);
        expect(idea).toBeTruthy();
        const patch = await backofficeCtx.patch(`/api/idea/${idea.id}`, { data: { done: true } });
        expect(patch.ok()).toBeTruthy();

        await page.goto('/ideas');
        await expect(page.locator('.item', { hasText: ideaTitle })).toHaveCount(0);

        await page.getByText('Afficher les idées déjà réalisées').click();
        const row = page.locator('.item', { hasText: ideaTitle });
        await expect(row).toBeVisible();
        await expect(row.getByText(/✅ Réalisée le/)).toBeVisible();
    });

    test('la modération exige la session backoffice', async ({ playwright }) => {
        const anon = await playwright.request.newContext({ baseURL: 'http://localhost:3000' });
        const list = await anon.get('/api/idea');
        const idea = ((await list.json()).ideas ?? [])[0];

        if (idea) {
            expect((await anon.patch(`/api/idea/${idea.id}`, { data: { done: true } })).status()).toBe(403);
            expect((await anon.delete(`/api/idea/${idea.id}`)).status()).toBe(403);
        }
        await anon.dispose();
    });

    test('la création est limitée à 5 idées par heure et par IP', async ({ playwright }) => {
        // IP dédiée au test pour ne pas polluer les autres (le limiteur lit x-forwarded-for)
        const spam = await playwright.request.newContext({
            baseURL: 'http://localhost:3000',
            extraHTTPHeaders: { 'x-forwarded-for': `203.0.113.${Math.floor(Math.random() * 250)}` }
        });

        let lastStatus = 0;
        for (let i = 1; i <= 6; i++) {
            const res = await spam.post('/api/idea', { data: { title: `spam e2e ${Date.now()}-${i}` } });
            lastStatus = res.status();
        }
        expect(lastStatus).toBe(429);
        await spam.dispose();
    });
});

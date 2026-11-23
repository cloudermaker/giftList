import { test, expect } from '@playwright/test';
import type { NextApiRequest } from 'next';
import { uniqueName, createGroup, deleteCurrentGroup, gotoUntilVisible } from './fixtures';
import { buildReplyMailto, buildSupportContext, sanitizeFromPath } from '../lib/email/supportContext';

/**
 * Support : contexte du compte dans les emails de contact, lien de réponse prérempli, recherche backoffice.
 * Les emails ne partent pas en e2e (dry-run) : le contenu est testé via les fonctions qui le construisent.
 */
const PASSWORD = 'mdp-support-e2e';

const fakeRequest = (sessionCookie?: string): NextApiRequest =>
    ({
        cookies: sessionCookie ? { currentUser: sessionCookie } : {},
        headers: { 'user-agent': 'e2e-agent' }
    }) as unknown as NextApiRequest;

test.describe('Page d’origine du message', () => {
    test('garde un chemin interne, sans query string ni jeton', () => {
        expect(sanitizeFromPath('/group/abc')).toBe('/group/abc');
        expect(sanitizeFromPath('/giftList/abc?tab=1#top')).toBe('/giftList/abc');
        expect(sanitizeFromPath('/acces/secret-token')).toBe('/acces/…');
        expect(sanitizeFromPath('/email/confirmer/secret-token')).toBe('/email/…');
        expect(sanitizeFromPath('/join/invite-token')).toBe('/join/…');
        expect(sanitizeFromPath('/acces')).toBe('/acces');
    });

    test('refuse les URL externes et les valeurs invalides', () => {
        expect(sanitizeFromPath('//evil.com')).toBeNull();
        expect(sanitizeFromPath('/\\evil.com')).toBeNull();
        expect(sanitizeFromPath('https://evil.com')).toBeNull();
        expect(sanitizeFromPath('/with space')).toBeNull();
        expect(sanitizeFromPath(42)).toBeNull();
        expect(sanitizeFromPath(undefined)).toBeNull();
    });

    test('le lien « Nous contacter » du footer porte la page courante', async ({ page }) => {
        await page.goto('/help?x=1');
        await expect(page.locator('footer').getByRole('link', { name: /Nous contacter/ })).toHaveAttribute(
            'href',
            '/contact?from=%2Fhelp'
        );
    });
});

test.describe('Lien « Répondre » prérempli', () => {
    test('reprend le sujet et cite le message d’origine', () => {
        const href = buildReplyMailto(
            'jean+test@example.com',
            'Signaler un problème [#abc]',
            'Ligne 1\nLigne 2 & <b>',
            new Date(2026, 10, 23)
        );
        expect(href.startsWith('mailto:jean%2Btest@example.com?')).toBeTruthy();

        const params = new URLSearchParams(href.split('?')[1]);
        expect(params.get('subject')).toBe('Re: Signaler un problème [#abc]');
        const body = params.get('body') ?? '';
        expect(body).toContain('Bonjour,');
        expect(body).toContain('Votre message du 23/11/2026 :');
        expect(body).toContain('> Ligne 1\n> Ligne 2 & <b>');
    });

    test('tronque un long message pour rester sous la limite des liens mailto', () => {
        const href = buildReplyMailto('a@example.com', 'Sujet', 'x'.repeat(2000), new Date());
        const body = new URLSearchParams(href.split('?')[1]).get('body') ?? '';
        expect(body).toContain(`> ${'x'.repeat(1200)}`);
        expect(body).not.toContain('x'.repeat(1201));
    });
});

test.describe('Contexte du compte dans l’email', () => {
    test('visiteur non connecté : seulement la page et le navigateur', async () => {
        const lines = await buildSupportContext(fakeRequest(), '/help');
        expect(lines).toEqual([
            { label: 'Utilisateur', value: 'non connecté' },
            { label: 'Page', value: 'https://www.malistedecadeaux.fr/help' },
            { label: 'Navigateur', value: 'e2e-agent' }
        ]);
    });

    test('cookie de session falsifié : traité comme non connecté', async () => {
        const forged = `${Buffer.from(JSON.stringify({ userId: 'x', groupId: 'y' })).toString('base64url')}.bad-signature`;
        const lines = await buildSupportContext(fakeRequest(forged), null);
        expect(lines[0]).toEqual({ label: 'Utilisateur', value: 'non connecté' });
    });

    test('utilisateur connecté : prénom, groupe actif et groupes avec rôle', async ({ page }) => {
        const groupName = uniqueName('Support e2e');
        const userName = uniqueName('Marie');
        await createGroup(page, groupName, userName, PASSWORD);

        try {
            const cookie = (await page.context().cookies()).find((c) => c.name === 'currentUser');
            expect(cookie).toBeTruthy();
            const lines = await buildSupportContext(fakeRequest(cookie!.value), '/home');
            const byLabel = Object.fromEntries(lines.map((l) => [l.label, l.value]));

            // Les prénoms (et noms de groupe) sont normalisés en minuscules à l'enregistrement
            expect(byLabel['Utilisateur']).toMatch(new RegExp(`^${userName} \\(.+\\) · admin$`, 'i'));
            expect(byLabel['Groupe actif']).toMatch(new RegExp(`^${groupName} \\(.+\\)$`, 'i'));
            expect(byLabel['Groupes']).toMatch(new RegExp(`${groupName} \\(.+, admin\\)`, 'i'));
            expect(byLabel['Email lié']).toBe('aucun');
            expect(byLabel['Page']).toBe('https://www.malistedecadeaux.fr/home');

            // L'API accepte le message (dry-run) avec la page d'origine
            const res = await page.request.post('/api/sendEmail', {
                data: { senderEmail: 'e2e@example.com', subject: 'Signaler un problème', message: 'Test e2e', fromPath: '/home' }
            });
            expect((await res.json()).success).toBe(true);
        } finally {
            await deleteCurrentGroup(page);
        }
    });
});

test.describe('Recherche backoffice', () => {
    test('filtre les groupes par nom de groupe ou prénom de membre', async ({ page }) => {
        const groupName = uniqueName('Recherche e2e');
        const userName = uniqueName('Zelie');
        await createGroup(page, groupName, userName, PASSWORD);

        try {
            const login = await page.request.post('/api/backoffice/auth', {
                data: { login: process.env.BACKOFFICE_USERNAME, pass: process.env.BACKOFFICE_PASSWORD }
            });
            expect(login.ok()).toBeTruthy();

            // Par prénom de membre (casse ignorée)
            await gotoUntilVisible(page, `/backoffice?q=${encodeURIComponent(userName.toUpperCase())}`, groupName);
            await expect(page.getByText(/^1 groupe pour/)).toBeVisible();

            // Par nom de groupe, via le formulaire
            await page.getByRole('searchbox', { name: 'Rechercher un groupe ou un membre' }).fill(groupName);
            await page.getByRole('button', { name: 'Rechercher' }).click();
            await page.waitForURL((url) => url.searchParams.get('q') === groupName);
            await expect(page.getByText(`1 groupe pour « ${groupName} »`)).toBeVisible();

            // Sans résultat, puis effacer la recherche
            await page.goto('/backoffice?q=aucun-groupe-e2e-zzqx');
            await expect(page.getByText('0 groupe pour « aucun-groupe-e2e-zzqx »')).toBeVisible();
            await page.getByRole('button', { name: 'Effacer' }).click();
            await page.waitForURL(/\/backoffice$/);
            await expect(page.getByRole('searchbox', { name: 'Rechercher un groupe ou un membre' })).toHaveValue('');
        } finally {
            await deleteCurrentGroup(page);
        }
    });
});

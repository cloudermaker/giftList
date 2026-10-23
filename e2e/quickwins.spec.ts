import { test, expect } from '@playwright/test';
import { uniqueName, createGroup, readSession, deleteCurrentGroup } from './fixtures';
import prisma from '../lib/db/dbSingleton';

/**
 * Robustesse et petites améliorations : accueil en erreur, groupe supprimé, invitation invalide,
 * formulaire de contact, liens des cadeaux (accès direct + sécurité), préférence liste/grille.
 */
test.describe('Robustesse et liens', () => {
    test("l'accueil affiche une erreur avec « Réessayer » si le groupe ne se charge pas", async ({ page }) => {
        const groupName = uniqueName('e2e-qw');
        await createGroup(page, groupName, 'Alice', 'mdp');

        await page.route('**/api/group/*', (route) => route.fulfill({ status: 500, json: { success: false } }));
        await page.reload();
        await expect(page.getByText('Impossible de charger ton groupe pour le moment.')).toBeVisible();

        await page.unroute('**/api/group/*');
        await page.getByRole('button', { name: 'Réessayer' }).click();
        await expect(page.getByRole('heading', { name: groupName })).toBeVisible();

        await deleteCurrentGroup(page);
    });

    test("l'accueil d'un groupe supprimé explique et ramène à la connexion", async ({ page }) => {
        await createGroup(page, uniqueName('e2e-qw'), 'Alice', 'mdp');
        await deleteCurrentGroup(page);

        await page.goto('/home');
        await expect(page.getByText("Ce groupe n'existe plus.")).toBeVisible();
        await page.getByRole('button', { name: "Revenir à l'accueil" }).click();
        await page.waitForURL((url) => url.pathname === '/');
        await expect(page.getByText('Créer un groupe', { exact: true })).toBeVisible();
    });

    test("un lien d'invitation invalide affiche une page claire (pas une 404)", async ({ page }) => {
        const res = await page.goto('/join/lien-qui-n-existe-pas');
        expect(res?.status()).toBe(200);
        await expect(page.getByRole('heading', { name: "Ce lien d'invitation n'est plus valable" })).toBeVisible();
        await page.getByRole('button', { name: 'Aller à la page de connexion' }).click();
        await page.waitForURL((url) => url.pathname === '/');
    });

    test("le formulaire de contact garde le message quand l'envoi échoue", async ({ page }) => {
        await page.route('**/api/sendEmail', (route) => route.fulfill({ status: 500, json: { success: false, error: 'ko' } }));
        await page.goto('/contact');
        await page.locator('#email').fill('quelquun@example.com');
        await page.locator('#subject').selectOption({ index: 1 });
        await page.locator('#message').fill('Mon long message à ne pas perdre');
        await page.getByRole('button', { name: /Envoyer/ }).click();

        await expect(page.getByText('Oups, une erreur est survenue')).toBeVisible();
        await page.getByRole('button', { name: /Réessayer/ }).click();
        await expect(page.locator('#message')).toHaveValue('Mon long message à ne pas perdre');
        await expect(page.locator('#email')).toHaveValue('quelquun@example.com');
    });

    test('lien direct sur les cadeaux : seulement si un lien sûr existe, sans ouvrir la fiche', async ({ page, context }) => {
        await createGroup(page, uniqueName('e2e-qw'), 'Alice', 'mdp');
        const { userId } = (await readSession(page))!;
        await prisma.gift.createMany({
            data: [
                { name: 'Avec lien', url: 'https://example.com/produit', userId, order: 1 },
                { name: 'Sans protocole', url: 'example.org/objet', userId, order: 2 },
                { name: 'Lien piégé', url: 'javascript:alert(1)', userId, order: 3 },
                { name: 'Sans lien', userId, order: 4 }
            ]
        });
        await page.goto(`/giftList/${userId}`);

        const linkOf = (name: string) => page.getByRole('link', { name: `Ouvrir le lien de ${name}` });
        await expect(linkOf('Avec lien')).toHaveAttribute('href', 'https://example.com/produit');
        await expect(linkOf('Avec lien')).toHaveAttribute('target', '_blank');
        await expect(linkOf('Sans protocole')).toHaveAttribute('href', 'https://example.org/objet');
        await expect(linkOf('Lien piégé')).toHaveCount(0);
        await expect(linkOf('Sans lien')).toHaveCount(0);

        // Le clic ouvre la boutique dans un nouvel onglet, la fiche du cadeau reste fermée
        const [shop] = await Promise.all([context.waitForEvent('page'), linkOf('Avec lien').click()]);
        await shop.close();
        await expect(page.getByRole('heading', { name: 'Avec lien' })).toHaveCount(0);

        // Fiche du cadeau piégé : aucun bouton « Voir le cadeau »
        await page.locator('.item', { hasText: 'Lien piégé' }).click();
        await expect(page.getByRole('heading', { name: 'Lien piégé' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Voir le cadeau' })).toHaveCount(0);
        await expect(page.getByText('Pas de lien')).toBeVisible();

        await deleteCurrentGroup(page);
    });

    test("la vue grille mémorisée s'applique sans erreur d'hydratation", async ({ page }) => {
        await createGroup(page, uniqueName('e2e-qw'), 'Alice', 'mdp');
        const { userId } = (await readSession(page))!;
        await prisma.gift.create({ data: { name: 'Un cadeau', userId, order: 1 } });

        const hydrationErrors: string[] = [];
        page.on('console', (msg) => {
            if (msg.type() === 'error' && /hydrat|did not match|#418|#423|#425/i.test(msg.text()))
                hydrationErrors.push(msg.text());
        });
        await page.addInitScript(() => localStorage.setItem('giftListViewMode', 'grid'));
        await page.goto(`/giftList/${userId}`);

        await expect(page.locator('.grid', { hasText: 'Un cadeau' })).toBeVisible();
        expect(hydrationErrors).toEqual([]);

        await deleteCurrentGroup(page);
    });

    test('un prénom avec un caractère spécial est refusé à la création et à l’invitation', async ({ page, browser }) => {
        // Création de groupe : popin d'erreur, pas de redirection
        await page.goto('/');
        await page.getByText('Créer un groupe', { exact: true }).click();
        await page.locator('#groupNameInputId').fill(uniqueName('e2e-name'));
        await page.locator('#nameInputId').fill('Paul.');
        await page.locator('#passwordInputId').fill('mdp');
        await page.getByRole('button', { name: "C'est parti!" }).click();
        await expect(page.getByText('Prénom invalide')).toBeVisible();
        await expect(page).toHaveURL((url) => url.pathname === '/');
        await page.getByRole('button', { name: 'OK' }).click();

        // Un prénom composé reste accepté
        const groupName = uniqueName('e2e-name');
        await createGroup(page, groupName, "Jean-Marie O'Brien", 'mdp');

        // Invitation : même règle pour un nouveau membre
        const res = await page.request.get(`/api/group/${(await readSession(page))!.groupId}`);
        const inviteToken = (await res.json()).group.inviteToken as string;
        const ctx = await browser.newContext();
        const pageB = await ctx.newPage();
        await pageB.goto(`/join/${inviteToken}`);
        await pageB.locator('#userNameInput').fill('Bob.');
        await pageB.getByRole('button', { name: "C'est parti !" }).click();
        await expect(pageB.getByText('Prénom invalide')).toBeVisible();
        await ctx.close();

        await deleteCurrentGroup(page);
    });
});

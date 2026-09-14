import { test, expect } from '@playwright/test';
import { createGroup, deleteCurrentGroup, loginAsAdmin, uniqueName } from './fixtures';

test.describe('Smoke', () => {
    test('la page d’accueil s’affiche avec son contenu SEO', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Ma liste de cadeaux/);
        await expect(page.locator('h1')).toHaveText('Liste de cadeaux en ligne gratuite');
        await expect(page.getByText('Pour quelle occasion ?')).toBeVisible();
    });

    const publicPages: Array<[string, string | null]> = [
        ['/liste-de-noel', 'Liste de Noël en ligne, gratuite et partagée'],
        ['/liste-de-naissance', 'Liste de naissance gratuite, libre et multi-boutiques'],
        ['/liste-anniversaire', "Liste d'anniversaire en ligne avec réservation secrète"],
        ['/liste-de-mariage', 'Liste de mariage en ligne, libre et sans commission'],
        ['/mentions-legales', 'Mentions légales'],
        ['/confidentialite', 'Politique de confidentialité'],
        ['/help', null],
        ['/contact', null]
    ];

    for (const [path, h1] of publicPages) {
        test(`la page publique ${path} répond avec son h1`, async ({ page }) => {
            const response = await page.goto(path);
            expect(response?.status()).toBe(200);
            const heading = page.locator('h1');
            await expect(heading).toBeVisible();
            if (h1) await expect(heading).toHaveText(h1);
        });
    }

    test('un visiteur non connecté est redirigé de /home vers l’accueil', async ({ page }) => {
        await page.goto('/home');
        await page.waitForURL((url) => url.pathname === '/');
        await expect(page.locator('h1')).toHaveText('Liste de cadeaux en ligne gratuite');
    });

    test('cycle complet : création de groupe, déconnexion, reconnexion admin, suppression', async ({ page }) => {
        const groupName = uniqueName('e2e');
        const userName = 'TestE2E';
        const password = 'e2e-password';

        // Création → arrive sur /home avec le nom du groupe dans l'en-tête
        await createGroup(page, groupName, userName, password);
        await expect(page.getByText(groupName).first()).toBeVisible();
        await expect(page.getByText(userName).first()).toBeVisible();

        // Déconnexion → retour à l'accueil
        await page.getByTitle('Se déconnecter').click();
        await page.waitForURL((url) => url.pathname === '/');

        // Reconnexion en admin avec le mot de passe
        await loginAsAdmin(page, groupName, userName, password);
        await expect(page.getByText(groupName).first()).toBeVisible();

        // Nettoyage : suppression du groupe de test via l'API
        await deleteCurrentGroup(page);
    });

    test('une connexion admin avec un mauvais mot de passe est refusée', async ({ page }) => {
        const groupName = uniqueName('e2e');

        await createGroup(page, groupName, 'TestE2E', 'bon-mot-de-passe');
        await page.getByTitle('Se déconnecter').click();
        await page.waitForURL((url) => url.pathname === '/');

        // Tentative avec un mauvais mot de passe → message d'erreur, on reste sur l'accueil
        await page.getByText('Se connecter', { exact: true }).click();
        await page.locator('#groupNameInputId').fill(groupName);
        await page.locator('#nameInputId').fill('TestE2E');
        await page.locator('#adminCheckbox').check();
        await page.locator('#passwordInputId').fill('mauvais-mot-de-passe');
        await page.getByRole('button', { name: "C'est parti!" }).click();
        await expect(page.getByText('Mauvais mot de passe')).toBeVisible();

        // Nettoyage : reconnexion avec le bon mot de passe puis suppression
        await loginAsAdmin(page, groupName, 'TestE2E', 'bon-mot-de-passe');
        await deleteCurrentGroup(page);
    });
});

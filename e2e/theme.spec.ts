import { test, expect } from '@playwright/test';
import { createGroup, deleteCurrentGroup, uniqueName } from './fixtures';

test.describe('Menu compte sur téléphone', () => {
    test.use({ viewport: { width: 375, height: 800 } });

    test('profil, thème et déconnexion sont regroupés dans un seul menu', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'light' });
        await createGroup(page, uniqueName('e2e-theme'), 'Alice', 'e2e-password');
        try {
            await expect(page.getByTestId('theme-toggle')).toBeHidden();
            await expect(page.getByTitle('Se déconnecter')).toBeHidden();

            await page.getByRole('button', { name: 'Mon compte' }).click();
            const menu = page.getByRole('menu');
            await expect(menu.getByRole('menuitem')).toHaveText([/Mon profil/, /Thème : automatique/, /Se déconnecter/]);

            await menu.getByRole('menuitem', { name: /Thème/ }).click();
            await page.getByRole('button', { name: 'Mon compte' }).click();
            await expect(page.getByRole('menuitem', { name: /Thème : clair/ })).toBeVisible();

            await page.getByRole('menuitem', { name: /Mon profil/ }).click();
            await page.waitForURL('**/profil');
        } finally {
            await deleteCurrentGroup(page);
        }
    });
});

test.describe('Thème', () => {
    test('le bouton passe en clair puis en sombre, et le choix tient après rechargement', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'light' });
        await page.goto('/');
        const toggle = page.getByTestId('theme-toggle');
        const theme = () => page.evaluate(() => document.documentElement.dataset.theme);

        await expect(toggle).toHaveAttribute('data-theme-pref', 'system');
        expect(await theme()).toBe('light');

        await toggle.click();
        await expect(toggle).toHaveAttribute('data-theme-pref', 'light');
        await toggle.click();
        await expect(toggle).toHaveAttribute('data-theme-pref', 'dark');
        expect(await theme()).toBe('dark');

        await page.reload();
        expect(await theme()).toBe('dark');
        await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(26, 23, 20)');

        // Retour en automatique : suit le système
        await page.getByTestId('theme-toggle').click();
        await expect(page.getByTestId('theme-toggle')).toHaveAttribute('data-theme-pref', 'system');
        expect(await theme()).toBe('light');
    });

    test('en automatique, suit le réglage sombre du système', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.goto('/');
        expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
    });
});

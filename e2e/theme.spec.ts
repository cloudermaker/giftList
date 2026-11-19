import { test, expect } from '@playwright/test';

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

import { Page, expect } from '@playwright/test';

// Port dédié aux e2e : ne rentre jamais en collision avec le `npm run dev` manuel (3000)
export const E2E_BASE_URL = 'http://localhost:3100';

export const uniqueName = (prefix: string): string => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Les confirmations sweetalert2 (timer 1500ms) bloquent les clics tant que leur backdrop est affiché
export const waitForToastGone = async (page: Page): Promise<void> => {
    await expect(page.locator('.swal2-container')).toHaveCount(0);
};

export const createGroup = async (page: Page, groupName: string, userName: string, password: string): Promise<void> => {
    await page.goto('/');
    await page.getByText('Créer un groupe', { exact: true }).click();
    await page.locator('#groupNameInputId').fill(groupName);
    await page.locator('#nameInputId').fill(userName);
    await page.locator('#passwordInputId').fill(password);
    await page.getByRole('button', { name: "C'est parti!" }).click();
    await page.waitForURL('**/home');

    // Un nouveau groupe déclenche la modale d'onboarding : on la ferme si elle apparaît
    const closeOnboarding = page.getByRole('button', { name: '✕' });
    try {
        await closeOnboarding.click({ timeout: 3000 });
    } catch {
        // pas de modale : rien à fermer
    }
};

export const loginAsAdmin = async (page: Page, groupName: string, userName: string, password: string): Promise<void> => {
    await page.goto('/');
    await page.getByText('Se connecter', { exact: true }).click();
    await page.locator('#groupNameInputId').fill(groupName);
    await page.locator('#nameInputId').fill(userName);
    await page.locator('#adminCheckbox').check();
    await page.locator('#passwordInputId').fill(password);
    await page.getByRole('button', { name: "C'est parti!" }).click();
    await page.waitForURL('**/home');
};

// Le payload du cookie signé (partie avant le « . ») contient groupId/userId
export const readSession = async (page: Page): Promise<{ groupId: string; userId: string; isAdmin: boolean } | null> => {
    const cookie = (await page.context().cookies()).find((c) => c.name === 'currentUser');
    if (!cookie) return null;
    const payload = decodeURIComponent(cookie.value).split('.')[0];
    return JSON.parse(Buffer.from(payload, 'base64url').toString());
};

// Nettoyage : supprime le groupe courant via l'API (cookie admin partagé par page.request)
export const deleteCurrentGroup = async (page: Page): Promise<void> => {
    const session = await readSession(page);
    if (!session) return;
    const res = await page.request.delete(`/api/group/${session.groupId}`);
    expect(res.ok()).toBeTruthy();
};

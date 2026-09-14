import { test, expect, BrowserContext, Page } from '@playwright/test';
import { createGroup, deleteCurrentGroup, readSession, uniqueName, waitForToastGone } from './fixtures';

/**
 * Types de cadeaux avancés : MULTIPLE (sous-cadeaux) et UNLIMITED (multi-réservations).
 * Historiquement la logique la plus fragile du produit.
 */
test.describe.serial('Cadeaux MULTIPLE et UNLIMITED', () => {
    let ctxA: BrowserContext;
    let ctxB: BrowserContext;
    let pageA: Page;
    let pageB: Page;
    let groupName: string;
    let aliceUserId: string;

    const openGift = async (page: Page, name: string) => {
        await page.locator('.item', { hasText: name }).click();
    };

    test.beforeAll(async ({ browser }) => {
        groupName = uniqueName('e2e-types');

        ctxA = await browser.newContext();
        pageA = await ctxA.newPage();
        await createGroup(pageA, groupName, 'Alice', 'e2e-password');
        const session = await readSession(pageA);
        aliceUserId = session!.userId;

        const addBob = await pageA.request.post('/api/user', { data: { user: { name: 'Bob' }, groupId: session!.groupId } });
        expect(addBob.ok()).toBeTruthy();

        ctxB = await browser.newContext();
        pageB = await ctxB.newPage();
        await pageB.goto('/');
        await pageB.getByText('Se connecter', { exact: true }).click();
        await pageB.locator('#groupNameInputId').fill(groupName);
        await pageB.locator('#nameInputId').fill('Bob');
        await pageB.getByRole('button', { name: "C'est parti!" }).click();
        await pageB.waitForURL('**/home');
    });

    test.afterAll(async () => {
        await deleteCurrentGroup(pageA);
        await ctxA.close();
        await ctxB.close();
    });

    test('Alice crée un cadeau MULTIPLE et lui ajoute deux sous-cadeaux', async () => {
        await pageA.goto(`/giftList/${aliceUserId}`);
        await pageA.getByRole('button', { name: 'Ajouter un cadeau' }).click();
        await pageA.locator('#giftFormNameInput').fill('Manga');
        await pageA.getByText('Avec sous-éléments').click();
        await pageA.getByRole('button', { name: 'Créer' }).click();
        await waitForToastGone(pageA);
        await expect(pageA.getByText('🧩 0 élément')).toBeVisible();

        // Ajout des sous-cadeaux dans la modale
        await openGift(pageA, 'Manga');
        await pageA.getByText('Afficher les sous-cadeaux').click();
        for (const tome of ['Tome 1', 'Tome 2']) {
            await pageA.getByRole('button', { name: 'Ajouter un sous-cadeau' }).click();
            await pageA.getByPlaceholder('Nom du sous-cadeau (ex: Tome 1)').fill(tome);
            await pageA.getByRole('button', { name: 'Ajouter', exact: true }).click();
            await expect(pageA.getByText(tome)).toBeVisible();
        }
        await pageA.getByRole('button', { name: 'Fermer' }).click();
        await expect(pageA.getByText('🧩 2 éléments')).toBeVisible();
    });

    test('Bob réserve un sous-cadeau ; Alice ne voit pas la réservation', async () => {
        await pageB.goto(`/giftList/${aliceUserId}`);
        await openGift(pageB, 'Manga');
        await pageB.getByText('Afficher les sous-cadeaux').click();

        const tome1Row = pageB.locator('div.flex.items-center.justify-between', { hasText: 'Tome 1' });
        await tome1Row.getByRole('button', { name: 'Je le prends' }).click();
        await expect(tome1Row.getByText('Réservé par vous')).toBeVisible();
        // Tome 2 reste disponible
        await expect(pageB.getByText('Disponible')).toBeVisible();

        // Côté Alice : aucun état de réservation visible sur ses sous-cadeaux
        await pageA.goto(`/giftList/${aliceUserId}`);
        await openGift(pageA, 'Manga');
        await pageA.getByText('Afficher les sous-cadeaux').click();
        await expect(pageA.getByText('Tome 1')).toBeVisible();
        await expect(pageA.getByText('Réservé')).toHaveCount(0);
        await expect(pageA.getByText('Déjà réservé')).toHaveCount(0);
        await pageA.getByRole('button', { name: 'Fermer' }).click();
    });

    test('Alice crée un cadeau UNLIMITED, Bob le prend deux fois puis en retire un', async () => {
        // Création
        await pageA.goto(`/giftList/${aliceUserId}`);
        await pageA.getByRole('button', { name: 'Ajouter un cadeau' }).click();
        await pageA.locator('#giftFormNameInput').fill('Chocolats');
        await pageA.getByText('Illimité', { exact: false }).click();
        await pageA.getByRole('button', { name: 'Créer' }).click();
        await waitForToastGone(pageA);
        await expect(pageA.getByText('🔁 Illimité')).toBeVisible();

        // Bob prend deux fois (le bouton est dans le panneau déplié)
        await pageB.goto(`/giftList/${aliceUserId}`);
        await openGift(pageB, 'Chocolats');
        await pageB.getByText('Voir qui a pris ce cadeau').click();
        await pageB.getByRole('button', { name: 'Je prends ce cadeau' }).click();
        await waitForToastGone(pageB);
        await pageB.getByRole('button', { name: 'Je prends ce cadeau' }).click();
        await waitForToastGone(pageB);
        await expect(pageB.getByText('2 pris', { exact: true })).toBeVisible();

        // Il retire une de ses deux réservations
        const takers = pageB.getByText('vous');
        await expect(takers).toHaveCount(2);
        await pageB.getByRole('button', { name: 'Retirer' }).first().click();
        await waitForToastGone(pageB);
        await expect(pageB.getByText('1 pris', { exact: true })).toBeVisible();
        await pageB.getByRole('button', { name: 'Fermer' }).click();

        // Badge liste : 1 pris
        await expect(pageB.getByText('🔁 1 pris')).toBeVisible();
    });
});

import { test, expect, BrowserContext, Page } from '@playwright/test';
import { createGroup, deleteCurrentGroup, readSession, uniqueName, waitForToastGone } from './fixtures';

/**
 * Flux cœur du produit : cadeaux, réservation secrète, invitation, gestion des membres.
 * Un seul groupe (Alice admin + Bob membre) partagé par les tests, exécutés en série.
 */
test.describe.serial('Cadeaux et réservations', () => {
    let ctxA: BrowserContext;
    let ctxB: BrowserContext;
    let pageA: Page;
    let pageB: Page;
    let groupName: string;
    let groupId: string;
    let aliceUserId: string;

    test.beforeAll(async ({ browser }) => {
        groupName = uniqueName('e2e-gifts');

        // Alice crée le groupe (admin)
        ctxA = await browser.newContext();
        pageA = await ctxA.newPage();
        await createGroup(pageA, groupName, 'Alice', 'e2e-password');
        const session = await readSession(pageA);
        groupId = session!.groupId;
        aliceUserId = session!.userId;

        // Bob est ajouté via l'API (setup), puis se connecte en simple membre
        const addBob = await pageA.request.post('/api/user', { data: { user: { name: 'Bob' }, groupId } });
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

    test('Alice ajoute, modifie puis garde un cadeau sur sa liste', async () => {
        await pageA.goto(`/giftList/${aliceUserId}`);
        await pageA.getByRole('button', { name: 'Ajouter un cadeau' }).click();
        await pageA.locator('#giftFormNameInput').fill('Cadeau Test');
        await pageA.getByRole('button', { name: 'Créer' }).click();
        await expect(pageA.getByText('Cadeau Test')).toBeVisible();
        await waitForToastGone(pageA);

        // Édition
        await pageA.locator('.item', { hasText: 'Cadeau Test' }).click();
        await pageA.getByRole('button', { name: 'Modifier' }).click();
        await pageA.locator('#giftFormNameInput').fill('Cadeau Modifié');
        await pageA.getByRole('button', { name: 'Valider' }).click();
        await waitForToastGone(pageA);
        await expect(pageA.getByText('Cadeau Modifié')).toBeVisible();

        // Sonde CI : un reload re-lit la base — si ça échoue ici, l'édition n'a pas été persistée côté serveur
        await pageA.reload();
        await expect(pageA.locator('.item', { hasText: 'Cadeau Modifié' })).toBeVisible();
    });

    test('Bob réserve le cadeau en secret : Alice ne voit rien', async () => {
        // Bob voit le cadeau « Libre » sur la liste d'Alice
        await pageB.goto(`/giftList/${aliceUserId}`);
        await expect(pageB.getByText('Libre')).toBeVisible();
        // Diagnostic CI : afficher le contenu réel des lignes avant l'assertion
        console.log('Lignes vues par Bob :', JSON.stringify(await pageB.locator('.item').allInnerTexts()));
        await expect(pageB.locator('.item', { hasText: 'Cadeau Modifié' })).toBeVisible();

        // Bob réserve depuis la modale
        await pageB.locator('.item', { hasText: 'Cadeau Modifié' }).click();
        await pageB.getByRole('button', { name: 'Je prends ce cadeau' }).click();
        await expect(pageB.getByRole('button', { name: 'Je ne prends plus ce cadeau' })).toBeVisible();
        await waitForToastGone(pageB);
        await pageB.getByRole('button', { name: 'Fermer' }).click();
        await expect(pageB.getByText('Pris', { exact: true })).toBeVisible();

        // Alice, elle, ne voit AUCUNE trace de la réservation sur sa propre liste
        await pageA.goto(`/giftList/${aliceUserId}`);
        await expect(pageA.getByText('Cadeau Modifié')).toBeVisible();
        await expect(pageA.getByText('Pris', { exact: true })).toHaveCount(0);
        await expect(pageA.getByText('Bob')).toHaveCount(0);
    });

    test('la réservation apparaît dans « À acheter » de Bob, puis il la libère', async () => {
        const bobSession = await readSession(pageB);
        await pageB.goto(`/takenGiftList/${bobSession!.userId}`);
        await expect(pageB.getByText('Cadeau Modifié')).toBeVisible();

        // Libération depuis la liste d'Alice
        await pageB.goto(`/giftList/${aliceUserId}`);
        await pageB.locator('.item', { hasText: 'Cadeau Modifié' }).click();
        await pageB.getByRole('button', { name: 'Je ne prends plus ce cadeau' }).click();
        await expect(pageB.getByRole('button', { name: 'Je prends ce cadeau' })).toBeVisible();
        await waitForToastGone(pageB);
        await pageB.getByRole('button', { name: 'Fermer' }).click();
        await expect(pageB.getByText('Libre')).toBeVisible();
    });

    test('un proche rejoint le groupe via le lien d’invitation', async ({ browser }) => {
        // Le token d'invitation via l'API (le bouton UI copie dans le presse-papier)
        const res = await pageA.request.get(`/api/group/${groupId}`);
        const inviteToken = (await res.json()).group.inviteToken as string;
        expect(inviteToken).toBeTruthy();

        const ctxC = await browser.newContext();
        const pageC = await ctxC.newPage();
        await pageC.goto(`/join/${inviteToken}`);
        await expect(pageC.getByText(groupName)).toBeVisible();
        await pageC.locator('#userNameInput').fill('Chloé');
        await pageC.getByRole('button', { name: "C'est parti !" }).click();
        // Étape de confirmation anti-usurpation
        await pageC.getByRole('button', { name: 'Oui, je suis un nouveau membre' }).click();
        await pageC.waitForURL('**/home');
        await expect(pageC.getByText(groupName).first()).toBeVisible();
        await ctxC.close();
    });

    test('Alice (admin) renomme un membre depuis la page du groupe', async () => {
        await pageA.goto(`/group/${groupId}`);
        // Ligne de Bob → bouton Modifier (prompt sweetalert2)
        const bobRow = pageA.locator('.item', { hasText: 'Bob' });
        await bobRow.getByRole('button', { name: /Modifier/ }).click();
        await pageA.locator('.swal2-input').fill('Bobby');
        await pageA.getByRole('button', { name: 'Renommer' }).click();
        await expect(pageA.locator('.item', { hasText: 'Bobby' })).toBeVisible();
        await waitForToastGone(pageA);
    });

    test('connexion au backoffice et liste des groupes', async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        await page.goto('/backoffice');
        await page.locator('#swal-login').fill(process.env.BACKOFFICE_USERNAME ?? '');
        await page.locator('#swal-pass').fill(process.env.BACKOFFICE_PASSWORD ?? '');
        const authResponse = page.waitForResponse('**/api/backoffice/auth');
        await page.getByRole('button', { name: 'Connexion' }).click();
        expect((await authResponse).status()).toBe(200);
        // Titre exact de la page (et non celui de la modale « Accès backoffice »)
        await expect(page.getByRole('heading', { name: 'Backoffice', exact: true })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Groupes', exact: true })).toBeVisible();
        // Notre groupe de test (le plus récent) est en tête de la première page
        await expect(page.getByText(groupName)).toBeVisible();
        await ctx.close();
    });
});

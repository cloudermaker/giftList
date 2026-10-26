import { test, expect, BrowserContext, Page } from '@playwright/test';
import { createGroup, deleteCurrentGroup, gotoUntilVisible, readSession, uniqueName, waitForToastGone } from './fixtures';

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
        await pageA.getByRole('button', { name: 'Ajouter un cadeau' }).first().click();
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
        await expect(pageA.getByText('Cadeau Modifié', { exact: true })).toBeVisible();

        // Persistance : un reload re-lit la base, pas seulement l'état local
        await pageA.reload();
        await expect(pageA.locator('.item', { hasText: 'Cadeau Modifié' })).toBeVisible();
    });

    test('Bob réserve le cadeau en secret : Alice ne voit rien', async () => {
        // Bob voit le cadeau « Libre » sur la liste d'Alice
        await pageB.goto(`/giftList/${aliceUserId}`);
        await expect(pageB.getByText('Libre')).toBeVisible();
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
        await expect(pageA.getByText('Cadeau Modifié', { exact: true })).toBeVisible();
        await expect(pageA.getByText('Pris', { exact: true })).toHaveCount(0);
        await expect(pageA.getByText('Bob')).toHaveCount(0);
    });

    test('Bob marque sa réservation comme achetée : Alice ne voit rien', async () => {
        const bobSession = await readSession(pageB);
        await pageB.goto(`/takenGiftList/${bobSession!.userId}`);

        // Groupé par destinataire, compteur d'achats
        const aliceGroup = pageB.getByRole('region', { name: 'Pour Alice' });
        await expect(aliceGroup.getByText('0/1 acheté')).toBeVisible();

        // Fiche détail au clic sur la ligne, puis « acheté » depuis la fiche
        await aliceGroup.locator('.item', { hasText: 'Cadeau Modifié' }).click();
        await pageB.getByRole('button', { name: 'Marquer comme acheté' }).click();
        await expect(pageB.getByText(/Acheté le/)).toBeVisible();
        await pageB.getByRole('button', { name: 'Fermer' }).click();

        // Persistance
        await gotoUntilVisible(pageB, `/takenGiftList/${bobSession!.userId}`, '1/1 acheté');
        await expect(aliceGroup.getByText('Acheté', { exact: true })).toBeVisible();

        // Secret : aucune trace du statut côté propriétaire (ni rendu ni données de page)
        await pageA.goto(`/giftList/${aliceUserId}`);
        await expect(pageA.getByText('Cadeau Modifié', { exact: true })).toBeVisible();
        expect(await pageA.content()).not.toContain('boughtAt');

        // Le bouton rond de la ligne repasse en « pas encore acheté »
        await aliceGroup.getByRole('button', { name: 'Marquer Cadeau Modifié comme pas encore acheté' }).click();
        await expect(aliceGroup.getByText('0/1 acheté')).toBeVisible();
    });

    test('la réservation apparaît dans « À acheter » de Bob, puis il la libère', async () => {
        const bobSession = await readSession(pageB);
        await pageB.goto(`/takenGiftList/${bobSession!.userId}`);
        await expect(pageB.getByText('Cadeau Modifié', { exact: true })).toBeVisible();

        // Libération depuis la liste d'Alice
        await pageB.goto(`/giftList/${aliceUserId}`);
        await pageB.locator('.item', { hasText: 'Cadeau Modifié' }).click();
        await pageB.getByRole('button', { name: 'Je ne prends plus ce cadeau' }).click();
        await expect(pageB.getByRole('button', { name: 'Je prends ce cadeau' })).toBeVisible();
        await waitForToastGone(pageB);
        await pageB.getByRole('button', { name: 'Fermer' }).click();
        await expect(pageB.getByText('Libre')).toBeVisible();
    });

    test('Bob libère depuis « Mes réservations » ; nom long lisible sur mobile', async () => {
        const longName = 'Coffret de thés japonais avec théière en fonte et tasses assorties';
        await pageA.goto(`/giftList/${aliceUserId}`);
        await pageA.getByRole('button', { name: 'Ajouter un cadeau' }).first().click();
        await pageA.locator('#giftFormNameInput').fill(longName);
        await pageA.getByRole('button', { name: 'Créer' }).click();
        await waitForToastGone(pageA);

        await gotoUntilVisible(pageB, `/giftList/${aliceUserId}`, longName);
        await pageB.locator('.item', { hasText: longName }).click();
        await pageB.getByRole('button', { name: 'Je prends ce cadeau' }).click();
        await waitForToastGone(pageB);

        const bobSession = await readSession(pageB);
        await pageB.setViewportSize({ width: 375, height: 812 });
        await gotoUntilVisible(pageB, `/takenGiftList/${bobSession!.userId}`, longName);
        const name =pageB.locator('.item span.font-medium', { hasText: longName });
        await expect(name).toBeVisible();
        // Pas de troncature : le texte tient dans sa boîte
        expect(await name.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBeTruthy();

        await pageB.locator('.item', { hasText: longName }).click();
        await pageB.getByRole('button', { name: 'Libérer' }).click();
        await waitForToastGone(pageB);
        await expect(pageB.getByText('Aucun cadeau réservé pour le moment')).toBeVisible();
        await pageB.setViewportSize({ width: 1280, height: 720 });
    });

    test('Bob ajoute, modifie, achète puis supprime un cadeau personnel', async () => {
        const bobSession = await readSession(pageB);
        await pageB.goto(`/takenGiftList/${bobSession!.userId}`);

        await pageB.getByRole('button', { name: 'Ajouter un cadeau personnel' }).click();
        await pageB.getByLabel('Nom du cadeau').fill('Bouquet de fleurs');
        await expect(pageB.getByLabel('Pour qui ?').locator('option', { hasText: 'Alice' })).toHaveCount(1);
        // Les prénoms sont enregistrés en minuscules
        await pageB.getByLabel('Pour qui ?').selectOption({ label: 'alice' });
        await pageB.getByRole('button', { name: 'Valider' }).click();
        await waitForToastGone(pageB);
        const row = pageB.locator('.item', { hasText: 'Bouquet de fleurs' });
        await expect(row.getByText('Pour alice')).toBeVisible();

        // Édition depuis la fiche
        await row.click();
        await pageB.getByRole('button', { name: 'Modifier' }).click();
        await pageB.getByLabel('Nom du cadeau').fill('Bouquet de pivoines');
        await pageB.getByRole('button', { name: 'Valider' }).click();
        await waitForToastGone(pageB);
        const edited = pageB.locator('.item', { hasText: 'Bouquet de pivoines' });
        await expect(edited).toBeVisible();

        // Acheté depuis la ligne, persistant
        await edited.getByRole('button', { name: 'Marquer Bouquet de pivoines comme acheté' }).click();
        await expect(edited.getByText('Acheté', { exact: true })).toBeVisible();
        await expect(async () => {
            await pageB.reload();
            await expect(edited.getByText('Acheté', { exact: true })).toBeVisible({ timeout: 2000 });
        }).toPass({ timeout: 20000 });

        // Suppression
        await edited.click();
        await pageB.getByRole('button', { name: 'Supprimer' }).click();
        await pageB.getByRole('button', { name: 'Oui!' }).click();
        await waitForToastGone(pageB);
        await expect(pageB.getByText('Aucun cadeau personnel ajouté')).toBeVisible();
    });

    test('Alice (admin) peut aussi réserver un cadeau sur la liste de Bob', async () => {
        const bobSession = await readSession(pageB);
        await pageB.goto(`/giftList/${bobSession!.userId}`);
        await pageB.getByRole('button', { name: 'Ajouter un cadeau' }).first().click();
        await pageB.locator('#giftFormNameInput').fill('Casque audio');
        await pageB.getByRole('button', { name: 'Créer' }).click();
        await waitForToastGone(pageB);

        await gotoUntilVisible(pageA, `/giftList/${bobSession!.userId}`, 'Casque audio');
        await pageA.locator('.item', { hasText: 'Casque audio' }).click();
        // L'admin garde Modifier/Supprimer et peut réserver
        await expect(pageA.getByRole('button', { name: 'Modifier' })).toBeVisible();
        await pageA.getByRole('button', { name: 'Je prends ce cadeau' }).click();
        await expect(pageA.getByRole('button', { name: 'Je ne prends plus ce cadeau' })).toBeVisible();
        await waitForToastGone(pageA);
        await pageA.getByRole('button', { name: 'Je ne prends plus ce cadeau' }).click();
        await expect(pageA.getByRole('button', { name: 'Je prends ce cadeau' })).toBeVisible();
        await waitForToastGone(pageA);
    });

    test('la réservation s’affiche tout de suite et revient en arrière si le serveur refuse', async () => {
        const bobSession = await readSession(pageB);
        await pageA.goto(`/giftList/${bobSession!.userId}`);
        await pageA.locator('.item', { hasText: 'Casque audio' }).click();

        // Serveur lent : l'état « pris » apparaît avant la réponse
        await pageA.route('**/api/gift/*/take', async (route) => {
            await new Promise((r) => setTimeout(r, 1500));
            await route.continue();
        });
        await pageA.getByRole('button', { name: 'Je prends ce cadeau' }).click();
        await expect(pageA.getByRole('button', { name: 'Je ne prends plus ce cadeau' })).toBeVisible({ timeout: 700 });
        await expect(pageA.getByText('Cadeau réservé !')).toBeVisible();
        await waitForToastGone(pageA);
        await pageA.unroute('**/api/gift/*/take');

        // Rejet serveur : retour à « libre » + message d'erreur
        await pageA.route('**/api/gift/*/take', (route) => route.fulfill({ status: 500, json: { success: false } }));
        await pageA.getByRole('button', { name: 'Je ne prends plus ce cadeau' }).click();
        await expect(pageA.getByText('Impossible de réserver ce cadeau.')).toBeVisible();
        await pageA.getByRole('button', { name: 'OK' }).click();
        await expect(pageA.getByRole('button', { name: 'Je ne prends plus ce cadeau' })).toBeVisible();
        await pageA.unroute('**/api/gift/*/take');

        // Nettoyage : libère le cadeau
        await pageA.getByRole('button', { name: 'Je ne prends plus ce cadeau' }).click();
        await expect(pageA.getByRole('button', { name: 'Je prends ce cadeau' })).toBeVisible();
        await waitForToastGone(pageA);
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
        await pageC.getByRole('button', { name: "C'est noté" }).click();
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

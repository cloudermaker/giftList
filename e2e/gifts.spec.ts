import { test, expect, BrowserContext, Page } from '@playwright/test';
import { createGroup, deleteCurrentGroup, gotoUntilVisible, readSession, uniqueName, waitForToastGone } from './fixtures';

/**
 * Flux cœur du produit : cadeaux, réservation secrète, invitation, gestion des membres.
 * Un seul groupe (Alice admin + Bob membre) partagé par les tests, exécutés en série.
 */
const TODAY = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' }).format(new Date());

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

    test('Alice voit quand son cadeau a été ajouté', async () => {
        await pageA.locator('.item', { hasText: 'Cadeau Modifié' }).click();
        await pageA.getByRole('button', { name: 'Dates du cadeau' }).click();
        const dates = pageA.getByRole('dialog', { name: 'Dates du cadeau' });
        await expect(dates.getByText(`Ajouté le ${TODAY}`)).toBeVisible();
        // Ajouté et modifié le même jour : seule la date d'ajout s'affiche
        await expect(dates.getByText(/Modifié le/)).toHaveCount(0);
        await expect(dates.getByText(/Réservé le/)).toHaveCount(0);

        // « ? » et ✕ alignés
        const help = await pageA.getByRole('button', { name: 'Dates du cadeau' }).boundingBox();
        const cross = await pageA.getByText('✕', { exact: true }).boundingBox();
        expect(Math.abs(help!.y + help!.height / 2 - (cross!.y + cross!.height / 2))).toBeLessThanOrEqual(1);

        // La petite fiche s'ouvre juste sous le « ? »
        const box = await dates.boundingBox();
        expect(box!.y - (help!.y + help!.height)).toBeLessThanOrEqual(12);

        // Un clic ailleurs dans la fiche referme la petite fiche, pas la grande
        await pageA.getByRole('heading', { name: 'Cadeau Modifié' }).click();
        await expect(dates).toBeHidden();
        await pageA.getByRole('button', { name: 'Fermer' }).click();
    });

    test('avec un nom très long, la petite fiche des dates reste collée au « ? »', async () => {
        const longName = 'Un cadeau au nom vraiment très long pour remplir plusieurs lignes dans la fiche '.repeat(2).trim();
        await pageA.goto(`/giftList/${aliceUserId}`);
        await pageA.getByRole('button', { name: 'Ajouter un cadeau' }).first().click();
        await pageA.locator('#giftFormNameInput').fill(longName);
        await pageA.getByRole('button', { name: 'Créer' }).click();
        await waitForToastGone(pageA);

        await pageA.locator('.item', { hasText: longName }).click();
        const help = pageA.getByRole('button', { name: 'Dates du cadeau' });
        await help.click();
        const helpBox = (await help.boundingBox())!;
        const datesBox = (await pageA.getByRole('dialog', { name: 'Dates du cadeau' }).boundingBox())!;
        expect(datesBox.y - (helpBox.y + helpBox.height)).toBeLessThanOrEqual(12);

        await pageA.getByRole('button', { name: 'Supprimer' }).click();
        await pageA.locator('.swal2-confirm').click();
        await expect(pageA.locator('.item', { hasText: longName })).toHaveCount(0);
    });

    test('réordonner la liste ne change pas la date de modification', async () => {
        await pageA.goto(`/giftList/${aliceUserId}`);
        await pageA.getByRole('button', { name: 'Ajouter un cadeau' }).first().click();
        await pageA.locator('#giftFormNameInput').fill('Cadeau Second');
        await pageA.getByRole('button', { name: 'Créer' }).click();
        await waitForToastGone(pageA);
        await gotoUntilVisible(pageA, `/giftList/${aliceUserId}`, 'Cadeau Second');

        const gifts: { id: string; updatedAt: string }[] = await pageA.evaluate(
            () => (window as any).__NEXT_DATA__.props.pageProps.giftList
        );
        const reordered = [...gifts].reverse().map((g, i) => ({ ...g, order: i + 1, name: 'Écrasé' }));
        const res = await pageA.request.post('/api/gift', {
            data: { gifts: reordered, initiatorUserId: aliceUserId, userGiftId: aliceUserId }
        });
        expect(res.ok()).toBeTruthy();

        for (const gift of gifts) {
            const after = (await (await pageA.request.get(`/api/gift?giftId=${gift.id}`)).json()).gift;
            expect(after.updatedAt).toBe(gift.updatedAt);
            // Le réordonnancement ne touche que l'ordre, jamais le contenu
            expect(after.name).not.toBe('Écrasé');
        }

        await pageA.request.delete(`/api/gift/${gifts.find((g: any) => g.name === 'Cadeau Second')!.id}`);
    });

    test('Bob réserve le cadeau en secret : Alice ne voit rien', async () => {
        // Bob voit le cadeau « Libre » sur la liste d'Alice
        await pageB.goto(`/giftList/${aliceUserId}`);
        await expect(pageB.getByText('Libre')).toBeVisible();
        await expect(pageB.locator('.item', { hasText: 'Cadeau Modifié' })).toBeVisible();

        // Bob réserve depuis la modale
        await pageB.locator('.item', { hasText: 'Cadeau Modifié' }).click();
        await pageB.getByRole('button', { name: 'Je prends ce cadeau' }).click();
        await waitForToastGone(pageB);
        // La fiche se ferme une fois le cadeau réservé
        await expect(pageB.getByRole('button', { name: 'Fermer' })).toHaveCount(0);
        await expect(pageB.getByText('Pris', { exact: true })).toBeVisible();

        // Alice, elle, ne voit AUCUNE trace de la réservation sur sa propre liste
        await pageA.goto(`/giftList/${aliceUserId}`);
        await expect(pageA.getByText('Cadeau Modifié', { exact: true })).toBeVisible();
        await expect(pageA.getByText('Pris', { exact: true })).toHaveCount(0);
        await expect(pageA.getByText('Bob')).toHaveCount(0);
        // Ni dans les données de la page
        expect(await pageA.content()).not.toContain('takenAt');

        // Bob voit quand il l'a réservé
        await pageB.locator('.item', { hasText: 'Cadeau Modifié' }).click();
        await pageB.getByRole('button', { name: 'Dates du cadeau' }).click();
        await expect(pageB.getByRole('dialog', { name: 'Dates du cadeau' }).getByText(`Réservé le ${TODAY}`)).toBeVisible();
        await pageB.getByRole('button', { name: 'Fermer' }).click();
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
        await expect(pageB.getByText('Cadeau réservé !')).toBeVisible();
        await waitForToastGone(pageB);

        const bobSession = await readSession(pageB);
        await pageB.setViewportSize({ width: 375, height: 812 });
        await gotoUntilVisible(pageB, `/takenGiftList/${bobSession!.userId}`, longName);
        const name = pageB.locator('.item span.font-medium', { hasText: longName });
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
        // Attendre la réponse serveur (toast) : la fiche ne se ferme qu'après, et un appel en cours serait coupé par la navigation suivante
        await pageA.getByRole('button', { name: 'Je prends ce cadeau' }).click();
        await expect(pageA.getByText('Cadeau réservé !')).toBeVisible();
        await expect(pageA.getByRole('button', { name: 'Fermer' })).toHaveCount(0);
        await waitForToastGone(pageA);
        await pageA.locator('.item', { hasText: 'Casque audio' }).click();
        await pageA.getByRole('button', { name: 'Je ne prends plus ce cadeau' }).click();
        await expect(pageA.getByText('Cadeau libéré !')).toBeVisible();
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
        await pageA.locator('.item', { hasText: 'Casque audio' }).click();

        // Rejet serveur : retour à « libre » + message d'erreur
        await pageA.route('**/api/gift/*/take', (route) => route.fulfill({ status: 500, json: { success: false } }));
        await pageA.getByRole('button', { name: 'Je ne prends plus ce cadeau' }).click();
        await expect(pageA.getByText('Impossible de réserver ce cadeau.')).toBeVisible();
        await pageA.getByRole('button', { name: 'OK' }).click();
        await expect(pageA.getByRole('button', { name: 'Je ne prends plus ce cadeau' })).toBeVisible();
        await pageA.unroute('**/api/gift/*/take');

        // Nettoyage : libère le cadeau
        await pageA.getByRole('button', { name: 'Je ne prends plus ce cadeau' }).click();
        await expect(pageA.getByText('Cadeau libéré !')).toBeVisible();
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

    test('backoffice sur téléphone : noms lisibles, actions des groupes et membres dans un menu', async ({ browser }) => {
        const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
        const page = await ctx.newPage();
        await page.goto('/backoffice');
        await page.locator('#swal-login').fill(process.env.BACKOFFICE_USERNAME ?? '');
        await page.locator('#swal-pass').fill(process.env.BACKOFFICE_PASSWORD ?? '');
        await page.getByRole('button', { name: 'Connexion' }).click();

        const isFullyShown = (el: Element) => el.scrollWidth <= el.clientWidth;
        const row = page.locator('.item', { hasText: groupName });
        const name = row.getByText(groupName, { exact: true });
        await expect(name).toBeVisible();
        expect(await name.evaluate(isFullyShown)).toBe(true);

        // Menu du groupe : visible en entier (pas coupé par la carte) et cliquable
        await row.getByRole('button', { name: 'Actions du groupe' }).click();
        const menu = page.getByRole('menu');
        for (const item of [/Renommer/, /Mot de passe/, /Supprimer/]) {
            await expect(menu.getByRole('menuitem', { name: item })).toBeInViewport({ ratio: 1 });
        }
        await menu.getByRole('menuitem', { name: /Renommer/ }).click();
        await expect(page.locator('.swal2-input')).toBeVisible();
        await page.getByRole('button', { name: 'Annuler' }).click();
        await expect(menu).toBeHidden();

        // Membres : nom lisible, actions dans un menu
        await name.click();
        const member = row.getByText(/^alice$/i);
        await expect(member).toBeVisible();
        expect(await member.evaluate(isFullyShown)).toBe(true);
        await row.getByRole('button', { name: /Actions de alice/i }).click();
        for (const item of [/Voir la liste/, /Renommer/, /Rétrograder/, /Supprimer/]) {
            await expect(menu.getByRole('menuitem', { name: item })).toBeInViewport({ ratio: 1 });
        }
        // Échap referme le menu
        await page.keyboard.press('Escape');
        await expect(menu).toBeHidden();
        await ctx.close();
    });

    test('le backoffice se valide avec Entrée et se quitte avec le bouton standard', async ({ browser }) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        await page.goto('/backoffice');
        await expect(page.locator('#swal-login')).toBeFocused();
        await page.locator('#swal-login').fill(process.env.BACKOFFICE_USERNAME ?? '');
        await page.locator('#swal-pass').fill(process.env.BACKOFFICE_PASSWORD ?? '');
        const authResponse = page.waitForResponse('**/api/backoffice/auth');
        await page.locator('#swal-pass').press('Enter');
        expect((await authResponse).status()).toBe(200);

        const logout = page.getByRole('button', { name: 'Se déconnecter' });
        await expect(logout).toBeVisible();
        await expect(logout).toHaveClass(/btn/);
        await logout.click();
        await page.waitForURL((url) => url.pathname === '/');
        await ctx.close();
    });
});

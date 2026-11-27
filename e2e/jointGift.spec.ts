import { test, expect, BrowserContext, Page } from '@playwright/test';
import { createGroup, deleteCurrentGroup, gotoUntilVisible, readSession, uniqueName, waitForToastGone } from './fixtures';

/** Cadeaux communs : un cadeau partagé entre deux membres du même groupe. */
test.describe.serial('Cadeaux communs', () => {
    let ctxA: BrowserContext;
    let ctxB: BrowserContext;
    let pageA: Page;
    let pageB: Page;
    let ctxC: BrowserContext;
    let pageC: Page;
    let aliceUserId: string;
    let bobUserId: string;
    let chloeUserId: string;
    let giftId: string;

    const loginAsMember = async (page: Page, groupName: string, name: string) => {
        await page.goto('/');
        await page.getByText('Se connecter', { exact: true }).click();
        await page.locator('#groupNameInputId').fill(groupName);
        await page.locator('#nameInputId').fill(name);
        await page.getByRole('button', { name: "C'est parti!" }).click();
        await page.waitForURL('**/home');
    };

    test.beforeAll(async ({ browser }) => {
        const groupName = uniqueName('e2e-joint');

        ctxA = await browser.newContext();
        pageA = await ctxA.newPage();
        await createGroup(pageA, groupName, 'Alice', 'e2e-password');
        const session = await readSession(pageA);
        aliceUserId = session!.userId;

        const addMember = async (name: string): Promise<string> => {
            const res = await pageA.request.post('/api/user', { data: { user: { name }, groupId: session!.groupId } });
            expect(res.ok()).toBeTruthy();
            return (await res.json()).user.id;
        };
        bobUserId = await addMember('Bob');
        chloeUserId = await addMember('Chloé');

        ctxB = await browser.newContext();
        pageB = await ctxB.newPage();
        await loginAsMember(pageB, groupName, 'Bob');

        ctxC = await browser.newContext();
        pageC = await ctxC.newPage();
        await loginAsMember(pageC, groupName, 'Chloé');
    });

    test.afterAll(async () => {
        await deleteCurrentGroup(pageA);
        await ctxA.close();
        await ctxB.close();
        await ctxC.close();
    });

    test('un cadeau commun créé par Alice apparaît une seule fois dans la section des deux pages', async () => {
        const res = await pageA.request.post('/api/gift', {
            data: { gift: { name: 'Weekend à Rome', userId: aliceUserId, coOwnerId: bobUserId }, userGiftId: aliceUserId }
        });
        expect(res.ok()).toBeTruthy();
        giftId = (await res.json()).gift.id;

        await gotoUntilVisible(pageA, `/giftList/${aliceUserId}`, 'Weekend à Rome');
        await gotoUntilVisible(pageB, `/giftList/${bobUserId}`, 'Weekend à Rome');
        await expect(pageA.getByText('Weekend à Rome')).toHaveCount(1);
        await expect(pageB.getByText('Weekend à Rome')).toHaveCount(1);
        await expect(pageB.getByText('Alice & Bob')).toBeVisible();
    });

    test('ni le créateur ni le partenaire ne peuvent réserver le cadeau commun', async () => {
        expect((await pageA.request.post(`/api/gift/${giftId}/take`)).status()).toBe(403);
        expect((await pageB.request.post(`/api/gift/${giftId}/take`)).status()).toBe(403);
    });

    test('le partenaire ne peut pas réserver un sous-cadeau du cadeau commun', async () => {
        const created = await pageA.request.post('/api/gift', {
            data: { gift: { name: 'Coffret', userId: aliceUserId, coOwnerId: bobUserId, giftType: 'MULTIPLE' }, userGiftId: aliceUserId }
        });
        const parentId = (await created.json()).gift.id;
        const sub = await pageA.request.post(`/api/gift/${parentId}/subgifts`, { data: { name: 'Tome 1' } });
        expect(sub.status()).toBe(201);
        const subGiftId = (await sub.json()).subGift.id;

        expect((await pageB.request.post(`/api/gift/${subGiftId}/take`)).status()).toBe(403);
    });

    test('Chloé réserve le cadeau : il apparaît pris sur les pages de Alice et de Bob', async () => {
        expect((await pageC.request.post(`/api/gift/${giftId}/take`)).ok()).toBeTruthy();
        await gotoUntilVisible(pageC, `/giftList/${aliceUserId}`, 'Pris');
        await gotoUntilVisible(pageC, `/giftList/${bobUserId}`, 'Pris');
    });

    test("le créateur et le partenaire ne voient aucune réservation sur la page de l'autre", async () => {
        await gotoUntilVisible(pageB, `/giftList/${aliceUserId}`, 'Weekend à Rome');
        await expect(pageB.getByText('Pris', { exact: true })).toHaveCount(0);
        await expect(pageB.getByText('Libre', { exact: true })).toHaveCount(0);
        await gotoUntilVisible(pageA, `/giftList/${bobUserId}`, 'Weekend à Rome');
        await expect(pageA.getByText('Pris', { exact: true })).toHaveCount(0);
        await expect(pageA.getByText('Libre', { exact: true })).toHaveCount(0);
    });

    test('la liste des cadeaux réservés montre les deux destinataires', async () => {
        await gotoUntilVisible(pageC, `/takenGiftList/${chloeUserId}`, 'Alice & Bob');
    });

    const createJoint = async (name: string, extra: Record<string, unknown> = {}): Promise<string> => {
        const res = await pageA.request.post('/api/gift', {
            data: { gift: { name, userId: aliceUserId, coOwnerId: bobUserId, ...extra }, userGiftId: aliceUserId }
        });
        expect(res.ok()).toBeTruthy();
        return (await res.json()).gift.id;
    };

    test('le partenaire peut ajouter un sous-cadeau à un cadeau commun', async () => {
        const parentId = await createJoint('Coffret partagé', { giftType: 'MULTIPLE' });
        const res = await pageB.request.post(`/api/gift/${parentId}/subgifts`, { data: { name: 'Tome 1' } });
        expect(res.status()).toBe(201);
        const subGiftId = (await res.json()).subGift.id;
        expect((await pageB.request.delete(`/api/gift/${subGiftId}`)).status()).toBe(200);
    });

    test('un partenaire invalide est refusé à la création et à la modification', async () => {
        const otherCtx = await ctxA.browser()!.newContext();
        const otherPage = await otherCtx.newPage();
        await createGroup(otherPage, uniqueName('e2e-joint-other'), 'Zoé', 'e2e-password');
        const strangerId = (await readSession(otherPage))!.userId;

        for (const coOwnerId of [aliceUserId, strangerId]) {
            const create = await pageA.request.post('/api/gift', {
                data: { gift: { name: 'Refusé', userId: aliceUserId, coOwnerId }, userGiftId: aliceUserId }
            });
            expect(create.status()).toBe(400);
            const patch = await pageA.request.patch(`/api/gift/${giftId}`, { data: { gift: { coOwnerId } } });
            expect(patch.status()).toBe(400);
        }

        await deleteCurrentGroup(otherPage);
        await otherCtx.close();
    });

    test('le partenaire modifie le cadeau puis le délie : il retourne sur la liste du créateur seul', async () => {
        const id = await createJoint('Concert');
        const edit = await pageB.request.patch(`/api/gift/${id}`, { data: { gift: { name: 'Concert à Lyon' } } });
        expect(edit.status()).toBe(200);
        const unlink = await pageB.request.patch(`/api/gift/${id}`, { data: { gift: { coOwnerId: null } } });
        expect(unlink.status()).toBe(200);

        await gotoUntilVisible(pageA, `/giftList/${aliceUserId}`, 'Concert à Lyon');
        await gotoUntilVisible(pageB, `/giftList/${bobUserId}`, 'Weekend à Rome');
        await expect(pageB.getByText('Concert à Lyon')).toHaveCount(0);
    });

    test('le partenaire supprime le cadeau commun pour les deux', async () => {
        const id = await createJoint('Dîner étoilé');
        expect((await pageB.request.delete(`/api/gift/${id}`)).status()).toBe(200);
        await gotoUntilVisible(pageA, `/giftList/${aliceUserId}`, 'Weekend à Rome');
        await expect(pageA.getByText('Dîner étoilé')).toHaveCount(0);
        await gotoUntilVisible(pageB, `/giftList/${bobUserId}`, 'Weekend à Rome');
        await expect(pageB.getByText('Dîner étoilé')).toHaveCount(0);
    });

    test('quand le créateur est supprimé, le cadeau commun reste sur la liste principale du partenaire', async () => {
        const session = (await readSession(pageA))!;
        const addDan = await pageA.request.post('/api/user', { data: { user: { name: 'Dan' }, groupId: session.groupId } });
        const danId = (await addDan.json()).user.id;
        const created = await pageA.request.post('/api/gift', {
            data: { gift: { name: 'Cadeau de Dan', userId: danId, coOwnerId: bobUserId }, userGiftId: danId }
        });
        expect(created.ok()).toBeTruthy();
        const sharedId = (await created.json()).gift.id;

        expect((await pageA.request.delete(`/api/user/${danId}`)).ok()).toBeTruthy();

        await gotoUntilVisible(pageB, `/giftList/${bobUserId}`, 'Cadeau de Dan');
        const edit = await pageB.request.patch(`/api/gift/${sharedId}`, { data: { gift: { name: 'Cadeau de Dan, repris' } } });
        expect(edit.status()).toBe(200);
    });

    test('Alice crée un cadeau commun depuis le formulaire', async () => {
        await pageA.goto(`/giftList/${aliceUserId}`);
        await pageA.getByRole('button', { name: 'Ajouter un cadeau' }).first().click();
        await pageA.locator('#giftFormNameInput').fill('Saut en parachute');
        await pageA.getByLabel('Cadeau commun avec :').selectOption({ label: 'bob' }); // les prénoms sont stockés en minuscules
        await pageA.getByRole('button', { name: 'Créer' }).click();
        await waitForToastGone(pageA);

        await expect(pageA.getByText('Saut en parachute')).toHaveCount(1);
        await expect(pageA.locator('section', { hasText: 'Cadeaux communs' }).getByText('Saut en parachute')).toBeVisible();
        await gotoUntilVisible(pageB, `/giftList/${bobUserId}`, 'Saut en parachute');
        await expect(pageB.locator('section', { hasText: 'Cadeaux communs' }).getByText('Saut en parachute')).toBeVisible();
    });

    test('Chloé réserve un cadeau commun depuis la section', async () => {
        await gotoUntilVisible(pageC, `/giftList/${aliceUserId}`, 'Saut en parachute');
        await pageC.locator('.item', { hasText: 'Saut en parachute' }).click();
        await pageC.getByRole('button', { name: 'Je prends ce cadeau' }).click();
        await waitForToastGone(pageC);
        await expect(pageC.locator('.item', { hasText: 'Saut en parachute' }).getByText('Pris', { exact: true })).toBeVisible();
    });

    test('le partenaire délie le cadeau depuis le formulaire : il quitte sa page', async () => {
        await gotoUntilVisible(pageB, `/giftList/${bobUserId}`, 'Saut en parachute');
        await pageB.locator('.item', { hasText: 'Saut en parachute' }).click();
        await pageB.getByRole('button', { name: 'Modifier' }).click();
        await pageB.getByLabel('Cadeau commun avec :').selectOption({ label: 'Personne' });
        await pageB.getByRole('button', { name: 'Valider' }).click();
        await waitForToastGone(pageB);
        await expect(pageB.getByText('Saut en parachute')).toHaveCount(0);
    });
});

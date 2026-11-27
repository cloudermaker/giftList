import { test, expect, BrowserContext, Page } from '@playwright/test';
import { createGroup, deleteCurrentGroup, gotoUntilVisible, readSession, uniqueName } from './fixtures';

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
});

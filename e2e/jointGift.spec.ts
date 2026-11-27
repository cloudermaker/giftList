import { test, expect, BrowserContext, Page } from '@playwright/test';
import { createGroup, deleteCurrentGroup, gotoUntilVisible, readSession, uniqueName } from './fixtures';

/** Cadeaux communs : un cadeau partagé entre deux membres du même groupe. */
test.describe.serial('Cadeaux communs', () => {
    let ctxA: BrowserContext;
    let ctxB: BrowserContext;
    let pageA: Page;
    let pageB: Page;
    let aliceUserId: string;
    let bobUserId: string;

    test.beforeAll(async ({ browser }) => {
        const groupName = uniqueName('e2e-joint');

        ctxA = await browser.newContext();
        pageA = await ctxA.newPage();
        await createGroup(pageA, groupName, 'Alice', 'e2e-password');
        const session = await readSession(pageA);
        aliceUserId = session!.userId;

        const addBob = await pageA.request.post('/api/user', { data: { user: { name: 'Bob' }, groupId: session!.groupId } });
        expect(addBob.ok()).toBeTruthy();
        bobUserId = (await addBob.json()).user.id;

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

    test('un cadeau commun créé par Alice apparaît une seule fois dans la section des deux pages', async () => {
        const res = await pageA.request.post('/api/gift', {
            data: { gift: { name: 'Weekend à Rome', userId: aliceUserId, coOwnerId: bobUserId }, userGiftId: aliceUserId }
        });
        expect(res.ok()).toBeTruthy();

        await gotoUntilVisible(pageA, `/giftList/${aliceUserId}`, 'Weekend à Rome');
        await gotoUntilVisible(pageB, `/giftList/${bobUserId}`, 'Weekend à Rome');
        await expect(pageA.getByText('Weekend à Rome')).toHaveCount(1);
        await expect(pageB.getByText('Weekend à Rome')).toHaveCount(1);
        await expect(pageB.getByText('Alice & Bob')).toBeVisible();
    });
});

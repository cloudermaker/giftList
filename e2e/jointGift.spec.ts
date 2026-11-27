import { test, expect, BrowserContext, Page } from '@playwright/test';
import { createGroup, deleteCurrentGroup, gotoUntilVisible, readSession, uniqueName, waitForToastGone } from './fixtures';
import prisma from '../lib/db/dbSingleton';
import { deleteGroup } from '../lib/db/groupManager';
import { mergeUsers } from '../lib/db/userManager';

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

    // --- Corrections issues de la revue finale ---

    test("un autre membre ne peut pas se désigner partenaire d'un cadeau commun par un POST avec son id", async () => {
        const id = await createJoint('Cabane');
        const hijack = await pageC.request.post('/api/gift', {
            data: { gift: { id, name: 'x', userId: aliceUserId, coOwnerId: chloeUserId }, userGiftId: aliceUserId }
        });
        expect(hijack.status()).toBe(403);
        const stored = await (await pageA.request.get(`/api/gift/${id}`)).json();
        expect(stored.gift.coOwnerId).toBe(bobUserId);
        expect(stored.gift.name).toBe('Cabane');
    });

    test('ni le créateur ni le partenaire ne reçoivent les réservations par les routes de lecture', async () => {
        const parentId = await createJoint('Coffret secret', { giftType: 'MULTIPLE' });
        expect((await pageA.request.post(`/api/gift/${parentId}/subgifts`, { data: { name: 'Planche' } })).status()).toBe(201);
        expect((await pageC.request.post(`/api/gift/${parentId}/take`)).ok()).toBeTruthy();

        for (const owner of [pageA, pageB]) {
            const byQuery = (await (await owner.request.get(`/api/gift?giftId=${parentId}`)).json()).gift;
            expect(byQuery.takenUserId).toBeNull();
            expect(byQuery.takenByList).toEqual([]);
            const byId = (await (await owner.request.get(`/api/gift/${parentId}`)).json()).gift;
            expect(byId.takenUserId).toBeNull();
            expect(byId.takenByList).toEqual([]);
            const subs = (await (await owner.request.get(`/api/gift/${parentId}/subgifts`)).json()).subGifts;
            expect(subs.length).toBe(1);
            expect(subs.every((s: { takenUserId: string | null }) => s.takenUserId === null)).toBe(true);
        }
        const asChloe = (await (await pageC.request.get(`/api/gift?giftId=${parentId}`)).json()).gift;
        expect(asChloe.takenUserId).toBe(chloeUserId);
    });

    test('la pastille des deux noms reste après une réservation qui rafraîchit le cadeau', async () => {
        await createJoint('Escape game', { giftType: 'UNLIMITED' });
        await gotoUntilVisible(pageC, `/giftList/${aliceUserId}`, 'Escape game');
        await pageC.locator('.item', { hasText: 'Escape game' }).click();
        await pageC.getByText('Voir qui a pris ce cadeau').click();
        await pageC.getByRole('button', { name: 'Je prends ce cadeau' }).click();
        await expect(pageC.locator('.item', { hasText: 'Escape game' })).toContainText('1 pris');
        await expect(pageC.locator('.item', { hasText: 'Escape game' })).toContainText(/alice & bob/i);
    });

    test("modifier le nom d'un cadeau commun reste possible quand le partenaire n'est plus dans le groupe", async () => {
        const session = (await readSession(pageA))!;
        const eve = await pageA.request.post('/api/user', { data: { user: { name: 'Eve' }, groupId: session.groupId } });
        const eveId = (await eve.json()).user.id;
        const res = await pageA.request.post('/api/gift', {
            data: { gift: { name: 'Pique-nique', userId: aliceUserId, coOwnerId: eveId }, userGiftId: aliceUserId }
        });
        const id = (await res.json()).gift.id;
        await prisma.userGroupMapping.deleteMany({ where: { userId: eveId } });

        const edit = await pageA.request.patch(`/api/gift/${id}`, { data: { gift: { name: 'Pique-nique chic', coOwnerId: eveId } } });
        expect(edit.status()).toBe(200);
    });
});

test.describe('Cadeaux communs : suppression et fusion de profils', () => {
    const makeGroup = (label: string) => prisma.group.create({ data: { name: uniqueName(label), adminPassword: 'x' } });
    const makeMember = async (name: string, groupId: string) => {
        const user = await prisma.user.create({ data: { name } });
        await prisma.userGroupMapping.create({ data: { userId: user.id, groupId } });
        return user.id;
    };

    test("la fusion d'un profil partenaire reporte le cadeau commun sur le profil conservé", async () => {
        const g1 = await makeGroup('e2e-merge-joint-1');
        const g2 = await makeGroup('e2e-merge-joint-2');
        try {
            const ownerId = await makeMember('owner', g1.id);
            const dropId = await makeMember('drop', g1.id);
            const keepId = await makeMember('keep', g2.id);
            const gift = await prisma.gift.create({ data: { name: 'Cadeau fusion', userId: ownerId, coOwnerId: dropId } });

            await mergeUsers(keepId, dropId);

            expect((await prisma.gift.findUnique({ where: { id: gift.id } }))?.coOwnerId).toBe(keepId);
        } finally {
            await deleteGroup(g1.id);
            await deleteGroup(g2.id);
        }
    });

    test('supprimer un groupe garde le cadeau commun du créateur pour le partenaire resté dans un autre groupe', async () => {
        const g1 = await makeGroup('e2e-delgroup-joint-1');
        const g2 = await makeGroup('e2e-delgroup-joint-2');
        try {
            const aliceId = await makeMember('alice', g1.id);
            const bobId = await makeMember('bob', g1.id);
            await prisma.userGroupMapping.create({ data: { userId: bobId, groupId: g2.id } });
            const gift = await prisma.gift.create({ data: { name: 'Cadeau groupe', userId: aliceId, coOwnerId: bobId } });

            await deleteGroup(g1.id);

            const kept = await prisma.gift.findUnique({ where: { id: gift.id } });
            expect(kept?.userId).toBe(bobId);
            expect(kept?.coOwnerId).toBeNull();
        } finally {
            await deleteGroup(g1.id);
            await deleteGroup(g2.id);
        }
    });
});

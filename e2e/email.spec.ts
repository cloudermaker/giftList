import { test, expect, Page, APIRequestContext } from '@playwright/test';
import { uniqueName, readSession, createGroup } from './fixtures';
import { createLoginToken } from '../lib/auth/loginToken';
import { setVerifiedEmail } from '../lib/auth/emailRecovery';

/**
 * Email de secours : liaison, confirmation, reconnexion par lien, règles de sécurité.
 * Les emails ne partent pas en e2e (dry-run) : les jetons sont créés directement, comme le ferait l'envoi.
 */
const PASSWORD = 'mdp-email-e2e';
const uniqueEmail = (): string => `e2e-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;

// Clé email de dernier recours : reconnexion admin par l'API puis suppression du groupe
const deleteGroupAsAdmin = async (request: APIRequestContext, groupName: string, userName: string) => {
    const res = await request.post('/api/authenticate', { data: { groupName, userName, password: PASSWORD } });
    const groupId = (await res.json()).groupUser?.groupId;
    if (groupId) await request.delete(`/api/group/${groupId}`);
};

const loginWithLink = async (page: Page, email: string, groupName: string): Promise<void> => {
    const token = await createLoginToken({ purpose: 'LOGIN', email });
    await page.goto(`/acces/${token}`);
    await page.getByRole('button', { name: new RegExp(groupName) }).click();
    await page.waitForURL('**/home');
};

test.describe('Email de secours', () => {
    test('création avec email, confirmation, puis reconnexion admin par lien (usage unique)', async ({ page, browser }) => {
        const groupName = uniqueName('e2e-mail');
        const email = uniqueEmail();

        await page.goto('/');
        await page.getByText('Créer un groupe', { exact: true }).click();
        await page.locator('#groupNameInputId').fill(groupName);
        await page.locator('#nameInputId').fill('Alice');
        await page.locator('#passwordInputId').fill(PASSWORD);
        await page.locator('#emailInputId').fill(email);
        await page.getByRole('button', { name: "C'est parti!" }).click();
        await expect(page.getByText('Vérifie ta boîte mail')).toBeVisible();
        await page.getByRole('button', { name: 'OK' }).click();
        await page.waitForURL('**/home');
        const session = await readSession(page);

        // Confirmation de l'adresse (lien reçu par email)
        const verifyToken = await createLoginToken({
            purpose: 'VERIFY_EMAIL',
            email,
            userId: session!.userId,
            grantsAdmin: true
        });
        await page.goto(`/email/confirmer/${verifyToken}`);
        await page.getByRole('button', { name: 'Confirmer mon adresse' }).click();
        await expect(page.getByText("C'est fait")).toBeVisible();

        // Reconnexion sur un autre appareil : email lié pendant une session admin → admin
        const ctx = await browser.newContext();
        const other = await ctx.newPage();
        const token = await createLoginToken({ purpose: 'LOGIN', email });
        await other.goto(`/acces/${token}`);
        await other.getByRole('button', { name: new RegExp(groupName) }).click();
        await other.waitForURL('**/home');
        const emailSession = await readSession(other);
        expect(emailSession).toMatchObject({ userId: session!.userId, isAdmin: true, emailAuth: true });

        // Le même lien ne fonctionne qu'une fois
        await other.goto(`/acces/${token}`);
        await expect(other.getByText('Ce lien a expiré ou a déjà été utilisé')).toBeVisible();
        await ctx.close();

        await deleteGroupAsAdmin(page.request, groupName, 'Alice');
    });

    test('un email confirmé est verrouillé et jamais exposé aux autres membres', async ({ page }) => {
        const groupName = uniqueName('e2e-mail');
        const email = uniqueEmail();

        await createGroup(page, groupName, 'Bob', PASSWORD);
        const session = await readSession(page);
        // Email lié hors session admin : il ne donnera pas les droits admin
        await setVerifiedEmail(session!.userId, email, false);

        // Session « prénom seul » : impossible de changer ou retirer l'email
        await page.request.post('/api/authenticate', { data: { groupName, userName: 'Bob' } });
        expect((await page.request.post('/api/auth/email', { data: { email: uniqueEmail() } })).status()).toBe(403);
        expect((await page.request.delete('/api/auth/email')).status()).toBe(403);

        // L'adresse n'apparaît ni dans l'API des membres ni en clair sur le profil
        const users = (await (await page.request.get(`/api/user?groupid=${session!.groupId}`)).json()).users;
        expect(users[0]).not.toHaveProperty('email');
        await page.goto('/profil');
        await expect(page.getByText(/e•••@example\.com/)).toBeVisible();
        await expect(page.getByText(email)).toHaveCount(0);

        // Reconnexion par lien : rôle ADMIN dans le groupe, mais email non lié en admin → pas de droits admin
        await loginWithLink(page, email, groupName);
        expect(await readSession(page)).toMatchObject({ isAdmin: false, emailAuth: true });

        // Session ouverte par email : l'adresse se modifie à nouveau
        expect((await page.request.post('/api/auth/email', { data: { email: uniqueEmail() } })).ok()).toBeTruthy();

        await deleteGroupAsAdmin(page.request, groupName, 'Bob');
    });

    test('un même email ouvre plusieurs groupes et permet de passer de l’un à l’autre', async ({ page }) => {
        const groupA = uniqueName('e2e-mail-A');
        const groupB = uniqueName('e2e-mail-B');
        const email = uniqueEmail();

        await createGroup(page, groupA, 'Chloé', PASSWORD);
        await setVerifiedEmail((await readSession(page))!.userId, email, true);
        await page.context().clearCookies();
        await createGroup(page, groupB, 'Chloé', PASSWORD);
        await setVerifiedEmail((await readSession(page))!.userId, email, true);

        // Le lien liste les deux groupes
        const token = await createLoginToken({ purpose: 'LOGIN', email });
        await page.goto(`/acces/${token}`);
        await expect(page.getByText('Choisis le groupe à ouvrir')).toBeVisible();
        await page.getByRole('button', { name: new RegExp(groupA) }).click();
        await page.waitForURL('**/home');

        // Depuis le profil : bascule vers l'autre groupe sans se reconnecter
        await page.goto('/profil');
        await page.getByRole('button', { name: new RegExp(groupB) }).click();
        await page.waitForURL('**/home');
        expect((await readSession(page))?.groupName).toBe(groupB);

        await deleteGroupAsAdmin(page.request, groupA, 'Chloé');
        await deleteGroupAsAdmin(page.request, groupB, 'Chloé');
    });

    test('« Accès oublié » répond pareil pour une adresse inconnue', async ({ page }) => {
        await page.goto('/');
        await page.getByText('Nom de groupe, prénom ou mot de passe oublié ?').click();
        await page.waitForURL('**/acces');
        await page.locator('#accessEmailInput').fill(uniqueEmail());
        await page.getByRole('button', { name: 'Recevoir un lien de connexion' }).click();
        await expect(page.getByText(/Si un profil est lié à/)).toBeVisible();

        // Les pages de lien refusent un jeton inventé
        await page.goto('/acces/jeton-invente-qui-ne-correspond-a-rien');
        await expect(page.getByText('Ce lien a expiré ou a déjà été utilisé')).toBeVisible();
    });
});

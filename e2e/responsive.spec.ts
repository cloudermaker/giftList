import { test, expect, Page } from '@playwright/test';
import { uniqueName } from './fixtures';
import prisma from '../lib/db/dbSingleton';
import { createLoginToken } from '../lib/auth/loginToken';
import { setVerifiedEmail } from '../lib/auth/emailRecovery';
import { deleteGroup } from '../lib/db/groupManager';

/**
 * Responsive : aucune page ne doit dépasser de l'écran (défilement horizontal ou élément coupé) sur téléphone et tablette.
 * Données volontairement longues (nom de groupe, prénoms composés, titres de cadeaux), là où les mises en page cassent.
 */
const WIDTHS = [375, 768];
const GROUP_PREFIX = 'Famille Dupont-Lefebvre de Montmorency';

// Éléments qui dépassent l'écran (hors éléments fixés), en ne gardant que les plus hauts dans l'arbre
const measure = (page: Page) =>
    page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const all = Array.from(document.querySelectorAll('body *')) as HTMLElement[];
        const offending = all.filter((el) => {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) return false;
            const cs = getComputedStyle(el);
            if (cs.position === 'fixed' || cs.visibility === 'hidden') return false;
            return r.right > vw + 1 || r.left < -1;
        });
        const offenders = offending
            .filter((el) => !offending.some((o) => o !== el && o.contains(el)))
            .slice(0, 4)
            .map((el) => `${el.tagName.toLowerCase()} "${(el.innerText || '').trim().slice(0, 30)}"`);
        return { horizontalScroll: document.documentElement.scrollWidth > vw, offenders };
    });

test('aucune page ne déborde sur téléphone ni tablette', async ({ browser }) => {
    test.setTimeout(300_000);

    // Restes d'un passage interrompu
    for (const g of await prisma.group.findMany({ where: { name: { startsWith: GROUP_PREFIX } } })) {
        await deleteGroup(g.id);
    }

    const setup = await browser.newContext();
    const sp = await setup.newPage();
    const groupName = `${GROUP_PREFIX} ${uniqueName('').slice(-4)}`;
    const res = await sp.request.post('/api/authenticate', {
        data: { groupName, userName: 'Marie-Christine', isCreating: true, password: 'mdp' }
    });
    const admin = (await res.json()).groupUser;
    const bob = await prisma.user.create({ data: { name: 'jean-baptiste' } });
    await prisma.userGroupMapping.create({ data: { userId: bob.id, groupId: admin.groupId } });
    await prisma.gift.createMany({
        data: [
            {
                name: 'Coffret de 12 bières artisanales belges avec verres gravés',
                url: 'https://example.com/a',
                userId: admin.userId,
                order: 1
            },
            { name: 'Pull', userId: admin.userId, order: 2 },
            { name: 'Lego Technic Porsche', url: 'https://example.com/b', userId: admin.userId, order: 3, giftType: 'MULTIPLE' },
            { name: 'Chocolats', url: 'https://example.com/c', userId: admin.userId, order: 4, giftType: 'UNLIMITED' },
            { name: 'Casque audio sans fil à réduction de bruit', url: 'https://example.com/d', userId: bob.id, order: 1 },
            { name: 'Bougie', userId: bob.id, order: 2 }
        ]
    });
    const bobGift = await prisma.gift.findFirst({ where: { userId: bob.id, name: 'Bougie' } });
    await prisma.userTakenGift.create({ data: { userId: admin.userId, giftId: bobGift!.id } });
    const email = `responsive-${Date.now()}@example.com`;
    await setVerifiedEmail(admin.userId, email, true);
    const group = await prisma.group.findUnique({ where: { id: admin.groupId } });

    const problems: string[] = [];
    const check = async (page: Page, width: number, name: string) => {
        await page.waitForTimeout(300);
        const m = await measure(page);
        if (m.horizontalScroll || m.offenders.length) {
            problems.push(
                `${width}px ${name}: ${m.horizontalScroll ? 'défilement horizontal ; ' : ''}${m.offenders.join(' | ')}`
            );
        }
    };

    for (const width of WIDTHS) {
        const ctx = await browser.newContext({ viewport: { width, height: 900 } });
        const page = await ctx.newPage();
        await page.request.post('/api/authenticate', { data: { groupName, userName: 'Marie-Christine', password: 'mdp' } });
        await page.request.post('/api/backoffice/auth', {
            data: { login: process.env.BACKOFFICE_USERNAME, pass: process.env.BACKOFFICE_PASSWORD }
        });
        const loginToken = await createLoginToken({ purpose: 'LOGIN', email });
        const verifyToken = await createLoginToken({ purpose: 'VERIFY_EMAIL', email, userId: admin.userId });

        const pages: [string, string, (() => Promise<void>)?][] = [
            ['accueil', '/home'],
            ['groupe', `/group/${admin.groupId}`],
            ['ma liste', `/giftList/${admin.userId}`],
            [
                'ma liste en grille',
                `/giftList/${admin.userId}`,
                async () => page.getByTitle('Vue grille').click({ timeout: 5000 })
            ],
            ['liste d’un autre', `/giftList/${bob.id}`],
            [
                'fiche cadeau',
                `/giftList/${admin.userId}`,
                async () => {
                    await page.getByTitle('Vue liste').click({ timeout: 5000 });
                    await page.locator('.item', { hasText: 'Lego Technic' }).click({ timeout: 5000 });
                    await page.getByRole('button', { name: 'Fermer' }).waitFor({ timeout: 5000 });
                }
            ],
            ['à acheter', `/takenGiftList/${admin.userId}`],
            ['profil', '/profil'],
            ['idées', '/ideas'],
            ['backoffice', '/backoffice'],
            ['aide', '/help'],
            ['contact', '/contact'],
            ['changelog', '/changelog'],
            ['mentions', '/mentions-legales'],
            ['confidentialité', '/confidentialite'],
            ['noël', '/liste-de-noel'],
            ['naissance', '/liste-de-naissance'],
            ['accès oublié', '/acces'],
            ['choix du profil', `/acces/${loginToken}`],
            ['confirmer email', `/email/confirmer/${verifyToken}`],
            ['invitation', `/join/${group!.inviteToken}`],
            ['invitation invalide', '/join/nimporte-quoi'],
            ['404', '/page-qui-n-existe-pas']
        ];
        for (const [name, url, action] of pages) {
            await page.goto(url);
            await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);
            if (action) await action();
            await check(page, width, name);
        }

        // Page de connexion, sans session
        const anon = await browser.newContext({ viewport: { width, height: 900 } });
        const ap = await anon.newPage();
        await ap.goto('/');
        await check(ap, width, 'connexion');
        await ap.getByText('Créer un groupe', { exact: true }).click();
        await check(ap, width, 'création de groupe');
        await anon.close();
        await ctx.close();
    }

    await deleteGroup(admin.groupId);
    await setup.close();
    expect(problems).toEqual([]);
});

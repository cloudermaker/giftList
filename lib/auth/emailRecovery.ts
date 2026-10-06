import prisma from '@/lib/db/dbSingleton';
import { TGroupAndUser } from '@/pages/api/authenticate';
import { actionEmail, sendMail, SITE_URL } from '@/lib/email/mailer';
import { createLoginToken, normalizeEmail } from './loginToken';

export type TEmailProfile = {
    userId: string;
    userName: string;
    groupId: string;
    groupName: string;
    isAdmin: boolean;
};

export type TEmailStatus = {
    email: string | null;
    verified: boolean;
    isAdminKey: boolean;
};

const EMAIL_FIELDS = { email: true, emailVerifiedAt: true, emailIsAdminKey: true } as const;

// Droits admin via email : rôle ADMIN dans le groupe ET email lié pendant une session admin
const toProfiles = (
    users: {
        id: string;
        name: string;
        emailIsAdminKey: boolean;
        groupMemberships: { role: string; group: { id: string; name: string } }[];
    }[]
): TEmailProfile[] =>
    users.flatMap((u) =>
        u.groupMemberships.map((m) => ({
            userId: u.id,
            userName: u.name,
            groupId: m.group.id,
            groupName: m.group.name,
            isAdmin: m.role === 'ADMIN' && u.emailIsAdminKey
        }))
    );

export const getProfilesByVerifiedEmail = async (email: string): Promise<TEmailProfile[]> => {
    const users = await prisma.user.findMany({
        where: { email: normalizeEmail(email), emailVerifiedAt: { not: null } },
        select: {
            id: true,
            name: true,
            emailIsAdminKey: true,
            groupMemberships: { select: { role: true, group: { select: { id: true, name: true } } } }
        },
        orderBy: { createdAt: 'asc' }
    });
    return toProfiles(users);
};

export const getEmailStatus = async (userId: string): Promise<TEmailStatus> => {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: EMAIL_FIELDS });
    return {
        email: user?.emailVerifiedAt ? user.email : null,
        verified: !!user?.emailVerifiedAt,
        isAdminKey: !!user?.emailIsAdminKey
    };
};

export const setVerifiedEmail = async (userId: string, email: string, grantsAdmin: boolean): Promise<void> => {
    await prisma.user.update({
        where: { id: userId },
        data: { email: normalizeEmail(email), emailVerifiedAt: new Date(), emailIsAdminKey: grantsAdmin }
    });
};

export const clearEmail = async (userId: string): Promise<void> => {
    await prisma.user.update({ where: { id: userId }, data: { email: null, emailVerifiedAt: null, emailIsAdminKey: false } });
};

// Un email déjà confirmé ne se change (ou ne se retire) que depuis une session ouverte par cet email
export const canChangeEmail = async (session: TGroupAndUser): Promise<boolean> => {
    if (session.emailAuth) return true;
    return !(await getEmailStatus(session.userId)).verified;
};

export const sessionForProfile = (profile: TEmailProfile): TGroupAndUser => ({
    groupId: profile.groupId,
    groupName: profile.groupName,
    userId: profile.userId,
    userName: profile.userName,
    isAdmin: profile.isAdmin,
    emailAuth: true
});

export const sendVerificationEmail = async ({
    userId,
    userName,
    groupName,
    email,
    grantsAdmin
}: {
    userId: string;
    userName: string;
    groupName: string;
    email: string;
    grantsAdmin: boolean;
}): Promise<void> => {
    const token = await createLoginToken({ purpose: 'VERIFY_EMAIL', email, userId, grantsAdmin });
    const mail = actionEmail({
        intro: `Confirme ton adresse pour retrouver facilement ton accès « ${escapeHtml(userName)} » dans le groupe « ${escapeHtml(groupName)} ».`,
        buttonLabel: 'Confirmer mon adresse',
        url: `${SITE_URL}/email/confirmer/${token}`,
        outro: "Ce lien est valable 24 heures. Si tu n'es pas à l'origine de cette demande, ignore simplement cet email."
    });
    await sendMail({ to: normalizeEmail(email), subject: 'Confirme ton adresse — Ma Liste de Cadeaux', ...mail });
};

// Réponse identique que l'email soit connu ou non (pas d'énumération des adresses)
export const sendLoginLink = async (email: string): Promise<void> => {
    const profiles = await getProfilesByVerifiedEmail(email);
    if (profiles.length === 0) return;
    const token = await createLoginToken({ purpose: 'LOGIN', email });
    const mail = actionEmail({
        intro: 'Voici ton lien pour te reconnecter à ta liste de cadeaux.',
        buttonLabel: 'Me connecter',
        url: `${SITE_URL}/acces/${token}`,
        outro: "Ce lien est valable 30 minutes et ne fonctionne qu'une fois. Si tu n'as rien demandé, ignore cet email."
    });
    await sendMail({ to: normalizeEmail(email), subject: 'Ton lien de connexion — Ma Liste de Cadeaux', ...mail });
};

const escapeHtml = (value: string): string =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

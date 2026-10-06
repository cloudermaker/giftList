import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import NProgress from 'nprogress';
import { Layout } from '@/components/layout';
import SEO from '@/components/SEO';
import { PageTitle } from '@/components/atoms/PageTitle';
import { CustomInput } from '@/components/atoms/customInput';
import CustomButton from '@/components/atoms/customButton';
import { ErrorAlert } from '@/components/atoms/ErrorAlert';
import { GoogleButton } from '@/components/atoms/GoogleButton';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import { alertError, confirmDestructive, toast } from '@/lib/ui/alert';
import { verifySession } from '@/lib/auth/session';
import { COOKIE_NAME } from '@/lib/auth/authService';
import { getEmailStatus, getProfilesByVerifiedEmail, TEmailProfile } from '@/lib/auth/emailRecovery';

type Props = {
    userName: string;
    groupName: string;
    // Adresse complète seulement si la session a été ouverte par email/Google ; sinon masquée
    displayEmail: string | null;
    verified: boolean;
    isAdminKey: boolean;
    canChange: boolean;
    otherProfiles: TEmailProfile[];
};

const maskEmail = (email: string): string => {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 1)}•••@${domain}`;
};

export default function ProfilePage({
    userName,
    groupName,
    displayEmail,
    verified,
    isAdminKey,
    canChange,
    otherProfiles
}: Props) {
    const { query } = useRouter();
    const [email, setEmail] = useState('');
    const [sentTo, setSentTo] = useState('');
    const [error, setError] = useState(
        query.email === 'verrouille' ? "Pour changer d'email, reconnecte-toi d'abord avec ton adresse actuelle." : ''
    );
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (query.email === 'google') toast('Adresse Google liée ✅');
    }, [query.email]);

    const sendConfirmation = async (): Promise<void> => {
        if (!email.trim()) {
            setError('Entre une adresse email.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const res = await AxiosWrapper.post('/api/auth/email', { email: email.trim() });
            if (res?.data?.success) setSentTo(email.trim());
            else setError(res?.data?.error ?? 'Adresse email invalide.');
        } finally {
            setIsLoading(false);
        }
    };

    const removeEmail = async (): Promise<void> => {
        const ok = await confirmDestructive({
            title: 'Retirer ton email ?',
            text: 'Tu ne pourras plus retrouver ton accès par email.',
            confirmText: 'Retirer',
            cancelText: 'Annuler'
        });
        if (!ok) return;
        const res = await AxiosWrapper.delete('/api/auth/email');
        if (res?.data?.success) window.location.reload();
        else alertError('Erreur', res?.data?.error ?? 'Impossible de retirer cet email.');
    };

    const switchTo = async (userId: string): Promise<void> => {
        const res = await AxiosWrapper.post('/api/auth/switch', { userId });
        if (res?.data?.success) {
            NProgress.start();
            window.location.href = '/home';
        } else {
            alertError('Erreur', res?.data?.error ?? 'Changement de groupe impossible.');
        }
    };

    return (
        <Layout>
            <SEO title="Mon profil" noIndex />
            <div className="max-w-xl mx-auto">
                <PageTitle eyebrow={`Groupe ${groupName}`}>
                    <span className="capitalize">{userName}</span>
                </PageTitle>

                <div className="item space-y-4">
                    <h2 className="text-lg font-semibold text-gray-800">📧 Email de secours</h2>
                    {error && <ErrorAlert message={error} onClose={() => setError('')} />}

                    {verified && displayEmail ? (
                        <>
                            <p className="text-sm text-gray-700">
                                ✅ <b>{displayEmail}</b> est lié à ton profil. En cas d&apos;oubli, utilise « Accès oublié ? » sur
                                la page de connexion.
                            </p>
                            {isAdminKey && <p className="text-xs text-gray-500">🛡️ Ce lien te reconnecte aussi en mode admin.</p>}
                            {canChange ? (
                                <CustomButton size="sm" onClick={removeEmail}>
                                    Retirer cet email
                                </CustomButton>
                            ) : (
                                <p className="text-xs text-gray-500">
                                    Pour changer ou retirer cet email, reconnecte-toi d&apos;abord avec le lien reçu par email.
                                </p>
                            )}
                        </>
                    ) : (
                        <p className="text-sm text-gray-600">
                            Ajoute un email pour retrouver ton accès si tu oublies le nom du groupe ou ton prénom. Il n&apos;est
                            visible par personne d&apos;autre.
                        </p>
                    )}

                    {canChange && !sentTo && (
                        <div className="space-y-3 pt-2">
                            <div className="flex flex-col sm:flex-row gap-2">
                                <CustomInput
                                    id="profileEmailInput"
                                    className="flex-1"
                                    type="email"
                                    value={email}
                                    onChange={setEmail}
                                    onKeyDown={(key) => (key === 'Enter' ? sendConfirmation() : undefined)}
                                    disabled={isLoading}
                                    placeholder={verified ? 'Nouvelle adresse' : 'prenom@exemple.fr'}
                                />
                                <CustomButton variant="green" size="sm" onClick={sendConfirmation} disabled={isLoading}>
                                    {isLoading ? '⏳ Envoi...' : verified ? 'Changer' : 'Ajouter'}
                                </CustomButton>
                            </div>
                            <GoogleButton intent="attach" label="Lier mon compte Google" />
                        </div>
                    )}

                    {sentTo && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                            📧 Un lien de confirmation a été envoyé à <b>{sentTo}</b>. Clique dessus pour terminer.
                        </div>
                    )}
                </div>

                {otherProfiles.length > 0 && (
                    <div className="item space-y-3">
                        <h2 className="text-lg font-semibold text-gray-800">👥 Mes autres groupes</h2>
                        <div className="flex flex-col gap-2">
                            {otherProfiles.map((p) => (
                                <CustomButton key={p.userId} variant="slate" size="sm" onClick={() => switchTo(p.userId)}>
                                    <span className="capitalize">{p.userName}</span>
                                    <span className="mx-1.5 opacity-70">·</span>
                                    {p.groupName}
                                </CustomButton>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
    const session = verifySession(context.req.cookies[COOKIE_NAME]);
    if (!session) return { redirect: { destination: '/', permanent: false } };

    const status = await getEmailStatus(session.userId);
    const emailAuth = !!session.emailAuth;
    const otherProfiles =
        emailAuth && status.email
            ? (await getProfilesByVerifiedEmail(status.email)).filter((p) => p.userId !== session.userId)
            : [];

    return {
        props: {
            userName: session.userName,
            groupName: session.groupName,
            displayEmail: status.email ? (emailAuth ? status.email : maskEmail(status.email)) : null,
            verified: status.verified,
            isAdminKey: status.isAdminKey,
            canChange: emailAuth || !status.verified,
            otherProfiles
        }
    };
};

import { useState } from 'react';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import NProgress from 'nprogress';
import { Layout } from '@/components/layout';
import SEO from '@/components/SEO';
import CustomButton from '@/components/atoms/customButton';
import { ErrorAlert } from '@/components/atoms/ErrorAlert';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import { findValidToken } from '@/lib/auth/loginToken';
import { getProfilesByVerifiedEmail, TEmailProfile } from '@/lib/auth/emailRecovery';

type Props = { token: string; valid: boolean; profiles: TEmailProfile[] };

// Arrivée depuis le lien email ou Google : un clic choisit le profil (le lien n'est consommé qu'à ce moment)
export default function ProfilePickerPage({ token, valid, profiles }: Props): JSX.Element {
    const [error, setError] = useState('');
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const pick = async (userId: string): Promise<void> => {
        setError('');
        setLoadingId(userId);
        const res = await AxiosWrapper.post('/api/auth/email/login', { token, userId });
        if (res?.data?.success) {
            NProgress.start();
            window.location.href = '/home';
            return;
        }
        setError(res?.data?.error ?? 'Connexion impossible.');
        setLoadingId(null);
    };

    return (
        <Layout withHeader={false}>
            <SEO title="Connexion" noIndex />
            <section className="flex justify-center items-start px-4 py-8">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 space-y-4">
                        <h1 className="text-2xl font-bold text-center text-gray-800">🎁 Te reconnecter</h1>
                        {error && <ErrorAlert message={error} onClose={() => setError('')} />}

                        {!valid && (
                            <p className="text-sm text-gray-600 text-center">
                                Ce lien a expiré ou a déjà été utilisé.{' '}
                                <Link href="/acces" className="text-rougeNoel hover:underline">
                                    Demande un nouveau lien
                                </Link>
                                .
                            </p>
                        )}

                        {valid && profiles.length === 0 && (
                            <p className="text-sm text-gray-600 text-center">
                                Aucun profil n&apos;est encore lié à cette adresse. Connecte-toi avec le nom du groupe et ton
                                prénom, puis ajoute ton email depuis ton profil 👤.
                            </p>
                        )}

                        {valid && profiles.length > 0 && (
                            <>
                                <p className="text-sm text-gray-600 text-center">
                                    {profiles.length > 1 ? 'Choisis le groupe à ouvrir :' : 'Ton profil :'}
                                </p>
                                <div className="flex flex-col gap-3">
                                    {profiles.map((p) => (
                                        <CustomButton
                                            key={p.userId}
                                            variant="green"
                                            className="w-full"
                                            onClick={() => pick(p.userId)}
                                            disabled={loadingId !== null}
                                        >
                                            <span className="capitalize">{p.userName}</span>
                                            <span className="mx-1.5 opacity-70">·</span>
                                            {p.groupName}
                                            {p.isAdmin && <span className="ml-2 text-xs opacity-80">(admin)</span>}
                                        </CustomButton>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                    <div className="p-6 bg-gray-50 text-sm text-center">
                        <Link href="/" className="text-gray-500 hover:underline">
                            ← Retour à l&apos;accueil
                        </Link>
                    </div>
                </div>
            </section>
        </Layout>
    );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
    const token = String(context.params?.token ?? '');
    const row = await findValidToken(token, 'LOGIN');
    if (!row) return { props: { token, valid: false, profiles: [] } };
    return { props: { token, valid: true, profiles: await getProfilesByVerifiedEmail(row.email) } };
};

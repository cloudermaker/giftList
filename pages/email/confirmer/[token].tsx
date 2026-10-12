import { useState } from 'react';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { Layout } from '@/components/layout';
import SEO from '@/components/SEO';
import CustomButton from '@/components/atoms/customButton';
import { ErrorAlert } from '@/components/atoms/ErrorAlert';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import { findValidToken } from '@/lib/auth/loginToken';
import prisma from '@/lib/db/dbSingleton';

type Props = { token: string; valid: boolean; email: string; userName: string; groupName: string };

export default function ConfirmEmailPage({ token, valid, email, userName, groupName }: Props): JSX.Element {
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const confirm = async (): Promise<void> => {
        setIsLoading(true);
        const res = await AxiosWrapper.post('/api/auth/email/confirm', { token });
        if (res?.data?.success) setDone(true);
        else setError(res?.data?.error ?? 'Confirmation impossible.');
        setIsLoading(false);
    };

    return (
        <Layout withHeader={false}>
            <SEO title="Confirmer mon email" noIndex />
            <section className="flex justify-center items-start px-4 py-8">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 space-y-4 text-center">
                        <h1 className="text-2xl font-bold text-gray-800">📧 Confirmer mon email</h1>
                        {error && <ErrorAlert message={error} onClose={() => setError('')} />}

                        {!valid && <p className="text-sm text-gray-600">Ce lien a expiré ou a déjà été utilisé.</p>}

                        {valid && !done && (
                            <>
                                <p className="text-sm text-gray-600">
                                    Lier <b>{email}</b> au profil <b className="capitalize">{userName}</b> du groupe{' '}
                                    <b>{groupName}</b> ?
                                </p>
                                <CustomButton variant="green" className="w-full" onClick={confirm} disabled={isLoading}>
                                    {isLoading ? '⏳ Confirmation...' : 'Confirmer mon adresse'}
                                </CustomButton>
                            </>
                        )}

                        {done && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                                ✅ C&apos;est fait ! Si tu oublies un jour le nom du groupe ou ton prénom, utilise « Accès oublié
                                ? » sur la page de connexion.
                            </div>
                        )}
                    </div>
                    <div className="p-6 bg-gray-50 text-sm text-center">
                        <Link href="/" className="text-gray-500 hover:underline">
                            Aller sur le site →
                        </Link>
                    </div>
                </div>
            </section>
        </Layout>
    );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
    const token = String(context.params?.token ?? '');
    const empty = { token, valid: false, email: '', userName: '', groupName: '' };
    const row = await findValidToken(token, 'VERIFY_EMAIL');
    if (!row?.userId) return { props: empty };

    const user = await prisma.user.findUnique({
        where: { id: row.userId },
        select: { name: true, groupMemberships: { select: { group: { select: { name: true } } }, take: 1 } }
    });
    if (!user) return { props: empty };
    return {
        props: {
            token,
            valid: true,
            email: row.email,
            userName: user.name,
            groupName: user.groupMemberships[0]?.group.name ?? ''
        }
    };
};

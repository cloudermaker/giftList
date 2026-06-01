import { useState } from 'react';
import { GetServerSideProps } from 'next';
import NProgress from 'nprogress';
import Cookies from 'js-cookie';
import { Layout } from '@/components/layout';
import { CustomInput } from '@/components/atoms/customInput';
import CustomButton from '@/components/atoms/customButton';
import { ErrorAlert } from '@/components/atoms/ErrorAlert';
import { COOKIE_NAME } from '@/lib/auth/authService';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import { TInviteJoinResult } from '@/pages/api/invite/join';
import { getGroupByInviteToken } from '@/lib/db/groupManager';

type Props = {
    groupName: string;
    token: string;
};

export default function JoinPage({ groupName, token }: Props): JSX.Element {
    const [userName, setUserName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [needsConfirmation, setNeedsConfirmation] = useState(false);

    const callJoinApi = async (confirm: boolean): Promise<void> => {
        setError('');
        setIsLoading(true);
        let navigating = false;

        try {
            const res = await AxiosWrapper.post('/api/invite/join', { token, userName: userName.trim(), confirm });
            const data = res?.data as TInviteJoinResult;

            if (data?.needsConfirmation) {
                setNeedsConfirmation(true);
                return;
            }

            if (data?.success && data.groupUser) {
                Cookies.set(COOKIE_NAME, btoa(JSON.stringify(data.groupUser)), { sameSite: 'Strict' });
                navigating = true;
                NProgress.start();
                window.location.href = '/home';
            } else if (data) {
                setError(data.error ?? 'Erreur');
            }
        } finally {
            if (!navigating) setIsLoading(false);
        }
    };

    const handleJoin = async (): Promise<void> => {
        if (!userName.trim()) {
            setError('Il faut rentrer un prénom.');
            return;
        }
        await callJoinApi(false);
    };

    const handleConfirm = () => callJoinApi(true);

    const handleCancelConfirmation = () => {
        setNeedsConfirmation(false);
        setIsLoading(false);
    };

    const onKeyDown = async (keyCode: string) => {
        if (keyCode === 'Enter') await handleJoin();
    };

    return (
        <Layout withHeader={false}>
            <section className="flex justify-center items-start px-4 py-8">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-6">
                            <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">
                                🎁 Rejoindre le groupe
                            </h1>
                            <p className="text-center text-vertNoel font-semibold text-lg mb-4">
                                {groupName}
                            </p>

                            {!needsConfirmation && (
                                <>
                                    <p className="text-sm text-gray-600 text-center mb-6">
                                        Entre ton prénom pour rejoindre le groupe.
                                    </p>

                                    {error && <ErrorAlert message={error} onClose={() => setError('')} />}

                                    <div className="space-y-2">
                                        <label htmlFor="userNameInput" className="block text-sm font-medium text-gray-700">
                                            Prénom
                                        </label>
                                        <CustomInput
                                            id="userNameInput"
                                            className="w-full"
                                            onChange={setUserName}
                                            value={userName}
                                            onKeyDown={onKeyDown}
                                            autoFocus
                                            disabled={isLoading}
                                            placeholder="Ex: Marie"
                                        />
                                    </div>
                                </>
                            )}

                            {needsConfirmation && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
                                    <p className="text-sm font-semibold text-amber-800 mb-1">
                                        ⚠️ Prénom non reconnu
                                    </p>
                                    <p className="text-sm text-amber-700">
                                        Le prénom <strong>&quot;{userName}&quot;</strong> n&apos;existe pas encore dans ce groupe.
                                        Vérifie que tu n&apos;as pas fait de faute de frappe.
                                    </p>
                                    <p className="text-sm text-amber-700 mt-2">
                                        Si tu es bien un nouveau membre, confirme pour rejoindre le groupe.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 bg-gray-50 flex flex-col gap-2">
                            {!needsConfirmation && (
                                <CustomButton className="w-full p-3 green-button" onClick={handleJoin} disabled={isLoading}>
                                    {isLoading ? '⏳ Chargement...' : "C'est parti !"}
                                </CustomButton>
                            )}

                            {needsConfirmation && (
                                <>
                                    <CustomButton className="w-full p-3 green-button" onClick={handleConfirm} disabled={isLoading}>
                                        {isLoading ? '⏳ Chargement...' : 'Oui, je suis un nouveau membre'}
                                    </CustomButton>
                                    <CustomButton className="w-full p-3" onClick={handleCancelConfirmation} disabled={isLoading}>
                                        Corriger mon prénom
                                    </CustomButton>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const { token } = context.params as { token: string };

    const group = await getGroupByInviteToken(token);

    if (!group) {
        return { notFound: true };
    }

    return {
        props: {
            groupName: group.name,
            token
        }
    };
};

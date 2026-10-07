import { useState } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout';
import SEO from '@/components/SEO';
import { CustomInput } from '@/components/atoms/customInput';
import CustomButton from '@/components/atoms/customButton';
import { ErrorAlert } from '@/components/atoms/ErrorAlert';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';

// « Accès oublié » : lien de connexion par email
export default function AccessPage(): JSX.Element {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const requestLink = async (): Promise<void> => {
        if (!email.trim()) {
            setError('Entre ton adresse email.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const res = await AxiosWrapper.post('/api/auth/email/request', { email: email.trim() });
            if (res?.data?.success) setSent(true);
            else setError(res?.data?.error ?? 'Adresse email invalide.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout withHeader={false}>
            <SEO title="Accès oublié" noIndex />
            <section className="flex justify-center items-start px-4 py-8">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 space-y-4">
                        <h1 className="text-2xl font-bold text-center text-gray-800">🔑 Accès oublié ?</h1>
                        <p className="text-sm text-gray-600 text-center">
                            Si tu as lié un email à ton profil, on t&apos;envoie un lien pour te reconnecter — sans retaper le nom
                            du groupe.
                        </p>

                        {error && <ErrorAlert message={error} onClose={() => setError('')} />}

                        {sent ? (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
                                📧 Si un profil est lié à <b>{email.trim()}</b>, un lien de connexion vient d&apos;y être envoyé.
                                Il est valable 30 minutes.
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label htmlFor="accessEmailInput" className="block text-sm font-medium text-gray-700">
                                        Ton email
                                    </label>
                                    <CustomInput
                                        id="accessEmailInput"
                                        className="w-full"
                                        type="email"
                                        value={email}
                                        onChange={setEmail}
                                        onKeyDown={(key) => (key === 'Enter' ? requestLink() : undefined)}
                                        disabled={isLoading}
                                        placeholder="prenom@exemple.fr"
                                        autoFocus
                                    />
                                </div>
                                <CustomButton variant="green" className="w-full" onClick={requestLink} disabled={isLoading}>
                                    {isLoading ? '⏳ Envoi...' : 'Recevoir un lien de connexion'}
                                </CustomButton>
                            </>
                        )}
                    </div>
                    <div className="p-6 bg-gray-50 text-sm text-center text-gray-600 space-y-2">
                        <p>
                            Pas d&apos;email lié ?{' '}
                            <Link href="/contact" className="text-rougeNoel hover:underline">
                                Contacte-nous
                            </Link>
                        </p>
                        <p>
                            <Link href="/" className="text-gray-500 hover:underline">
                                ← Retour à la connexion
                            </Link>
                        </p>
                    </div>
                </div>
            </section>
        </Layout>
    );
}

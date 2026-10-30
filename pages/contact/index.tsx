import CustomButton from '@/components/atoms/customButton';
import { Layout } from '@/components/layout';
import { PageTitle } from '@/components/atoms/PageTitle';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import Router from 'next/router';
import { useState } from 'react';
import { TSendEmailResult } from '../api/sendEmail';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import SEO from '@/components/SEO';

const FIELD_CLASS =
    'w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:border-gray-400 focus:border-vertNoel focus:ring-2 focus:ring-vertNoel/20 outline-hidden transition-colors disabled:opacity-60';

const SUBJECTS = [
    'Mot de passe oublié',
    'Signaler un problème',
    "Suggestion d'amélioration",
    'Question générale',
    'Autre demande'
];

export default function Contact() {
    const [email, setEmail] = useState<string>();
    const [subject, setSubject] = useState<string>('');
    const [message, setMessage] = useState<string>();
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(false);
    const { connectedUser } = useCurrentUser();

    // Define contact schema data
    const contactSchemaData = {
        __html: `{
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "Contactez-nous - Ma liste de cadeaux",
            "description": "Contactez-nous pour toute question concernant le service Ma liste de cadeaux ou pour obtenir de l'aide.",
            "url": "https://www.malistedecadeaux.fr/contact",
            "mainEntity": {
                "@type": "Organization",
                "name": "Ma liste de cadeaux",
                "email": "contact@malistedecadeaux.fr",
                "url": "https://www.malistedecadeaux.fr",
                "contactPoint": {
                    "@type": "ContactPoint",
                    "contactType": "customer service",
                    "availableLanguage": "French"
                }
            }
        }`
    };

    const onSubmit = async (): Promise<void> => {
        setIsLoading(true);
        setHasError(false);
        try {
            const response = await AxiosWrapper.post('/api/sendEmail', {
                senderEmail: email,
                subject: subject || 'Message de contact',
                message: message
            });
            const data = response?.data as TSendEmailResult;

            if (data?.success) {
                setIsSubmitted(true);
            } else {
                setHasError(true);
            }
        } catch (error) {
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <Layout withHeader={false}>
            <SEO
                title="Contactez-nous - Ma liste de cadeaux"
                description="Vous avez des questions sur l'utilisation de Ma liste de cadeaux? Besoin d'aide ou avez des suggestions? Contactez-nous facilement via notre formulaire."
                canonicalPath="/contact"
                ogImage="/og-image-contact.jpg"
            />
            <script type="application/ld+json" dangerouslySetInnerHTML={contactSchemaData} />

            <div>
                <div className="mb-8">
                    <PageTitle className="" eyebrow="Support">
                        Contactez-nous
                    </PageTitle>
                    <p className="text-gray-500 text-sm mt-2">
                        Une question, une suggestion ou besoin d&apos;aide ? Nous répondons sous 24 à 48 h.
                    </p>
                </div>

                <div className="item w-full max-w-xl mx-auto">
                    {!isSubmitted && !hasError && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                onSubmit();
                            }}
                            className="space-y-5"
                        >
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                                    Votre email
                                </label>
                                <input
                                    id="email"
                                    className={FIELD_CLASS}
                                    type="email"
                                    placeholder="prenom@exemple.fr"
                                    onChange={(e) => setEmail(e.target.value)}
                                    value={email}
                                    name="email"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="subject">
                                    Sujet
                                </label>
                                <select
                                    id="subject"
                                    className={FIELD_CLASS}
                                    onChange={(e) => setSubject(e.target.value)}
                                    value={subject}
                                    name="subject"
                                    required
                                    disabled={isLoading}
                                >
                                    <option value="">Choisissez un sujet</option>
                                    {SUBJECTS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="message">
                                    Votre message
                                </label>
                                <textarea
                                    id="message"
                                    className={`${FIELD_CLASS} resize-none`}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Décrivez votre demande en détail..."
                                    value={message}
                                    name="message"
                                    required
                                    rows={6}
                                    disabled={isLoading}
                                    maxLength={1000}
                                />
                                <div className="text-right text-xs text-gray-400">{message?.length || 0} / 1000</div>
                            </div>

                            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-1">
                                <CustomButton variant="slate" type="button" onClick={() => Router.push('/')} disabled={isLoading}>
                                    Annuler
                                </CustomButton>
                                <CustomButton variant="green" type="submit" onClick={() => undefined} disabled={isLoading}>
                                    {isLoading ? 'Envoi…' : 'Envoyer'}
                                </CustomButton>
                            </div>

                            <p className="text-center text-xs text-gray-500 pt-3 border-t border-gray-100">
                                Vous préférez nous écrire directement ?{' '}
                                <a href="mailto:contact@malistedecadeaux.fr" className="text-indigo-600 hover:underline">
                                    contact@malistedecadeaux.fr
                                </a>
                            </p>
                        </form>
                    )}

                    {isSubmitted && (
                        <div className="text-center py-6">
                            <div className="text-5xl mb-4">✅</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Message envoyé</h3>
                            <p className="text-gray-600 text-sm max-w-sm mx-auto mb-6">
                                Merci, nous l&apos;avons bien reçu. Nous vous répondrons à <strong>{email}</strong> sous 24 à 48
                                h.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <CustomButton variant="slate" onClick={() => Router.push(connectedUser ? '/home' : '/')}>
                                    Retour à l&apos;accueil
                                </CustomButton>
                                <CustomButton variant="green" onClick={() => setIsSubmitted(false)}>
                                    Envoyer un autre message
                                </CustomButton>
                            </div>
                        </div>
                    )}

                    {hasError && (
                        <div className="text-center py-6">
                            <div className="text-5xl mb-4">⚠️</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Oups, une erreur est survenue</h3>
                            <p className="text-gray-600 text-sm max-w-sm mx-auto mb-6">
                                Votre message n&apos;a pas pu être envoyé. Vous pouvez réessayer, ou nous écrire directement à{' '}
                                <a href="mailto:contact@malistedecadeaux.fr" className="text-indigo-600 hover:underline">
                                    contact@malistedecadeaux.fr
                                </a>
                                .
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <CustomButton variant="slate" onClick={() => Router.push(connectedUser ? '/home' : '/')}>
                                    Retour à l&apos;accueil
                                </CustomButton>
                                <CustomButton variant="green" onClick={() => setHasError(false)}>
                                    Réessayer
                                </CustomButton>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

import CustomButton from '@/components/atoms/customButton';
import { QuestionMarkIcon } from '@/components/icons/questionMark';
import { Layout } from '@/components/layout';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import Router from 'next/router';
import { useState } from 'react';
import { TSendEmailResult } from '../api/sendEmail';
import Swal from 'sweetalert2';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import SEO from '@/components/SEO';

export default function Contact(): JSX.Element {
    const [email, setEmail] = useState<string>();
    const [subject, setSubject] = useState<string>('');
    const [message, setMessage] = useState<string>();
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
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
        try {
            const response = await AxiosWrapper.post('/api/sendEmail', {
                senderEmail: email,
                subject: subject || 'Message de contact',
                message: message
            });
            const data = response?.data as TSendEmailResult;

            if (data?.success) {
                Swal.fire({
                    title: 'Envoyé !',
                    icon: 'success'
                });
                setIsSubmitted(true);
            } else {
                Swal.fire({
                    title: 'Erreur technique',
                    icon: 'error',
                    html: `Mince, ça n'a pas fonctionné.<br/><br/>Tu peux réessayer ou nous contacter directement à l'adresse <b>malistedecadeaux.contact@gmail.com</b>.`
                });
            }
        } catch (error) {
            Swal.fire({
                title: 'Erreur technique',
                icon: 'error',
                html: `Mince, ça n'a pas fonctionné.<br/><br/>Tu peux réessayer ou nous contacter directement à l'adresse <b>malistedecadeaux.contact@gmail.com</b>.`
            });
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <Layout withHeader={false}>
            <SEO
                title="Contactez-nous - Ma liste de cadeaux"
                description="Vous avez des questions sur l'utilisation de Ma liste de cadeaux? Besoin d'aide ou avez des suggestions? Contactez-nous facilement via notre formulaire."
                keywords="contact,aide,questions,suggestions,liste cadeaux"
                canonicalPath="/contact"
            />
            <script type="application/ld+json" dangerouslySetInnerHTML={contactSchemaData} />

            <div className="home-section my-8 item w-full md:w-2/3 lg:w-1/2">
                {/* Header Section */}
                <div className="text-center mb-10">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <QuestionMarkIcon className="-rotate-12 w-10 h-10 fill-vertNoel animate-pulse" />
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-vertNoel to-green-600 bg-clip-text text-transparent">
                            Contactez-nous
                        </h1>
                        <QuestionMarkIcon className="rotate-12 w-10 h-10 fill-rougeNoel animate-pulse" />
                    </div>
                    <p className="text-gray-600 text-sm md:text-base max-w-lg mx-auto">
                        Une question, une suggestion ou besoin d&apos;aide ? <br className="hidden sm:block" />
                        Notre équipe est là pour vous répondre ! 💌
                    </p>
                </div>

                {!isSubmitted && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSubmit();
                        }}
                        className="space-y-6"
                    >
                        <div className="text-center mb-6">
                            <p className="text-gray-600 text-sm md:text-base">
                                💬 Vous avez besoin d&apos;aide ? Des idées d&apos;amélioration du site ?
                            </p>
                            <p className="text-gray-500 text-xs mt-2">Nous vous répondrons dans les plus brefs délais !</p>
                        </div>

                        {/* Email field */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700" htmlFor="email">
                                <svg className="w-5 h-5 text-vertNoel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                </svg>
                                Votre email
                            </label>
                            <input
                                id="email"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-vertNoel focus:ring-2 focus:ring-vertNoel/20 transition-all duration-200 outline-none"
                                type="email"
                                placeholder="votre.email@exemple.com"
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                name="email"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {/* Subject field */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700" htmlFor="subject">
                                <svg className="w-5 h-5 text-vertNoel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                    />
                                </svg>
                                Sujet
                            </label>
                            <select
                                id="subject"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-vertNoel focus:ring-2 focus:ring-vertNoel/20 transition-all duration-200 outline-none bg-white"
                                onChange={(e) => setSubject(e.target.value)}
                                value={subject}
                                name="subject"
                                required
                                disabled={isLoading}
                            >
                                <option value="">-- Sélectionnez un sujet --</option>
                                <option value="🔑 Mot de passe oublié">🔑 Mot de passe oublié</option>
                                <option value="🐛 Signaler un problème">🐛 Signaler un problème</option>
                                <option value="💡 Suggestion d'amélioration">💡 Suggestion d&apos;amélioration</option>
                                <option value="❓ Question générale">❓ Question générale</option>
                                <option value="📧 Autre demande">📧 Autre demande</option>
                            </select>
                        </div>

                        {/* Message field */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700" htmlFor="message">
                                <svg className="w-5 h-5 text-vertNoel" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                    />
                                </svg>
                                Votre message
                            </label>
                            <textarea
                                id="message"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-vertNoel focus:ring-2 focus:ring-vertNoel/20 transition-all duration-200 outline-none resize-none"
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Décrivez votre demande en détail..."
                                value={message}
                                name="message"
                                required
                                rows={6}
                                disabled={isLoading}
                                maxLength={1000}
                            />
                            <div className="text-right text-xs text-gray-500">{message?.length || 0} / 1000 caractères</div>
                        </div>

                        {/* Buttons */}
                        <div className="float-right">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="green-button disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Envoi...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        Envoyer
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                            />
                                        </svg>
                                    </span>
                                )}
                            </button>
                            <CustomButton type="button" onClick={() => Router.push('/')} disabled={isLoading}>
                                🏠 Accueil
                            </CustomButton>
                        </div>
                    </form>
                )}

                {isSubmitted && (
                    <div className="text-center py-8">
                        {/* Success Icon with Animation */}
                        <div className="mb-6 relative inline-block">
                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div className="absolute -top-2 -right-2 text-4xl animate-pulse">✨</div>
                        </div>

                        {/* Success Message */}
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">Message envoyé avec succès ! 🎉</h3>

                        <div className="max-w-md mx-auto mb-6">
                            <p className="text-gray-600 mb-2">Merci pour ton message ! Notre équipe l&apos;a bien reçu.</p>
                            <p className="text-gray-600">
                                Nous te répondrons dans les plus brefs délais à l&apos;adresse <strong>{email}</strong>
                            </p>
                        </div>

                        {/* Info Box */}
                        <div className="max-w-md mx-auto mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800 flex items-center justify-center gap-2">
                                <span className="text-xl">💡</span>
                                <span>Délai de réponse habituel : 24-48h</span>
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <CustomButton
                                className="green-button px-6 py-3"
                                onClick={() => Router.push(connectedUser ? '/home' : '/')}
                            >
                                🏠 Revenir à l&apos;accueil
                            </CustomButton>
                            <CustomButton className="px-6 py-3" onClick={() => setIsSubmitted(false)}>
                                ✉️ Envoyer un autre message
                            </CustomButton>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

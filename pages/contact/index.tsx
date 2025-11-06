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
                keywords="contact,aide,questions,suggestions,liste cadeaux"
                canonicalPath="/contact"
            />
            <script type="application/ld+json" dangerouslySetInnerHTML={contactSchemaData} />

            <div className="home-section my-8 item w-full md:w-2/3 lg:w-1/2 relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-vertNoel/10 rounded-full blur-2xl"></div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-rougeNoel/10 rounded-full blur-2xl"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-vertNoel/20 to-transparent rounded-bl-full"></div>

                {/* Header Section */}
                <div className="text-center mb-10 relative">
                    <div className="flex items-center justify-center gap-3 mb-4 relative">
                        <QuestionMarkIcon className="-rotate-12 w-10 h-10 fill-vertNoel" />
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-vertNoel via-green-500 to-rougeNoel bg-clip-text text-transparent">
                            Contactez-nous
                        </h1>
                        <QuestionMarkIcon className="rotate-12 w-10 h-10 fill-rougeNoel" />
                    </div>
                    <p className="text-gray-700 text-sm md:text-base max-w-lg mx-auto font-medium">
                        Une question, une suggestion ou besoin d&apos;aide ? <br className="hidden sm:block" />
                        Notre équipe est là pour vous répondre ! 💌
                    </p>
                </div>

                {!isSubmitted && !hasError && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSubmit();
                        }}
                        className="space-y-6 relative"
                    >
                        <div className="text-center mb-6 relative">
                            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-vertNoel/10 to-green-100 px-4 py-2 rounded-full">
                                <span className="text-2xl">💬</span>
                                <p className="text-gray-700 text-sm md:text-base font-medium">On est là pour vous aider !</p>
                            </div>
                            <p className="text-gray-500 text-xs mt-3">Réponse garantie sous 24-48h</p>
                        </div>

                        {/* Email field */}
                        <div className="space-y-2 relative">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700" htmlFor="email">
                                <span className="text-lg">📧</span>
                                Votre email
                            </label>
                            <input
                                id="email"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-vertNoel focus:ring-2 focus:ring-vertNoel/20 transition-all duration-200 outline-none bg-white hover:border-gray-300"
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
                        <div className="space-y-2 relative">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700" htmlFor="subject">
                                <span className="text-lg">🏷️</span>
                                Sujet
                            </label>
                            <select
                                id="subject"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-vertNoel focus:ring-2 focus:ring-vertNoel/20 transition-all duration-200 outline-none bg-white hover:border-gray-300"
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
                        <div className="space-y-2 relative">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700" htmlFor="message">
                                <span className="text-lg">💬</span>
                                Votre message
                            </label>
                            <textarea
                                id="message"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-vertNoel focus:ring-2 focus:ring-vertNoel/20 transition-all duration-200 outline-none resize-none bg-white hover:border-gray-300"
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
                                    <span className="flex items-center gap-2">⏳ Envoi...</span>
                                ) : (
                                    <span className="flex items-center gap-1">Envoyer ✈️</span>
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
                            <div className="text-8xl animate-bounce">✅</div>
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

                {hasError && (
                    <div className="text-center py-8">
                        {/* Error Icon with Animation */}
                        <div className="mb-6 relative inline-block">
                            <div className="text-8xl">❌</div>
                        </div>

                        {/* Error Message */}
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">Oups, une erreur est survenue 😕</h3>

                        <div className="max-w-md mx-auto mb-6">
                            <p className="text-gray-600 mb-4">
                                Mince, ça n&apos;a pas fonctionné. Le message n&apos;a pas pu être envoyé.
                            </p>
                        </div>

                        {/* Info Box */}
                        <div className="max-w-md mx-auto mb-8 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-800 flex items-center justify-center gap-2 mb-2">
                                <span className="text-xl">💡</span>
                                <span className="font-semibold">Tu peux :</span>
                            </p>
                            <ul className="text-sm text-orange-800 text-left space-y-1">
                                <li>• Réessayer en cliquant sur le bouton ci-dessous</li>
                                <li>
                                    • Nous contacter directement à <strong>contact@malistedecadeaux.fr</strong>
                                </li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <CustomButton
                                className="green-button px-6 py-3"
                                onClick={() => {
                                    setHasError(false);
                                }}
                            >
                                🔄 Réessayer
                            </CustomButton>
                            <CustomButton className="px-6 py-3" onClick={() => Router.push(connectedUser ? '/home' : '/')}>
                                🏠 Retour à l&apos;accueil
                            </CustomButton>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}

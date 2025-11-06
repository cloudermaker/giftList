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

            <div className="home-section my-8 item w-full md:w-1/2">
                <div className="flex justify-around">
                    <QuestionMarkIcon className="-rotate-45 w-9 fill-vertNoel" />
                    <h2 className="bg-vertNoel/25 rounded-lg p-2 self-center text-center text-lg font-bold">Contactez-nous</h2>

                    <QuestionMarkIcon className="rotate-45 w-9 fill-rougeNoel" />
                </div>

                {!isSubmitted && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            onSubmit();
                        }}
                    >
                        <i className="py-5 block text-center">
                            Vous avez besoin d&apos;aide ? Des idées d&apos;amélioration du site ?
                        </i>

                        <div className="input-group">
                            <label className="input-label" htmlFor="email">
                                Votre email:
                            </label>
                            <input
                                id="email"
                                className="input-field"
                                type="email"
                                placeholder="Ton email"
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                                name="email"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="subject">
                                Sujet:
                            </label>
                            <select
                                id="subject"
                                className="input-field"
                                onChange={(e) => setSubject(e.target.value)}
                                value={subject}
                                name="subject"
                                required
                            >
                                <option value="">-- Sélectionnez un sujet --</option>
                                <option value="🔑 Mot de passe oublié">🔑 Mot de passe oublié</option>
                                <option value="🐛 Signaler un problème">🐛 Signaler un problème</option>
                                <option value="💡 Suggestion d'amélioration">💡 Suggestion d&apos;amélioration</option>
                                <option value="❓ Question générale">❓ Question générale</option>
                                <option value="📧 Autre demande">📧 Autre demande</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="input-label" htmlFor="message">
                                Votre message:
                            </label>
                            <textarea
                                id="message"
                                className="input-field min-h-[128px] p-4"
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Ton message"
                                value={message}
                                name="message"
                                required
                            />
                        </div>
                        <div className="float-right">
                            <button type="submit" className="green-button">
                                Envoyer
                            </button>
                            <CustomButton type="button" onClick={() => Router.push('/')}>
                                Accueil
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

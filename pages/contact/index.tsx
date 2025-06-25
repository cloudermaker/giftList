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
            subject: 'Message de contact',
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
                title: 'Erreur',
                text: `Mince, ça n'a pas fonctionné: ${data?.error ?? 'erreur technique'}`,
                icon: 'error'
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

            <h1 className="header text-center font-bold mt-8">✉️ Page de contact</h1>

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
                    <div className="text-center py-4">
                        <p>Ton message a bien été envoyé!</p>
                        <span className="step-emoji mb-0" role="img" aria-label="secret">
                            🫡
                        </span>
                        <p>Nous te répondrons dés que possible.</p>

                        <CustomButton className="green-button mt-8" onClick={() => Router.push(connectedUser ? '/home' : '/')}>
                            Revenir à la page principale
                        </CustomButton>
                    </div>
                )}
            </div>
        </Layout>
    );
}

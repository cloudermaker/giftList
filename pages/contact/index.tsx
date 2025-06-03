import CustomButton from '@/components/atoms/customButton';
import { QuestionMarkIcon } from '@/components/icons/questionMark';
import { Layout } from '@/components/layout';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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
            <h1 className="header text-center bg-white mt-8">Page de contact</h1>

            <div className="py-8 flex justify-center relative">
                <div className="bg-white w-fit h-fit rounded p-5 place-center border-vertNoel border-solid border-2">
                    <div className="flex justify-around">
                        <QuestionMarkIcon className="-rotate-45 w-9 fill-vertNoel absolute top-0 left-0 md:relative" />
                        <h2 className="bg-vertNoel/25 rounded-lg p-2 self-center text-center text-lg font-bold">
                            Contactez-nous
                        </h2>

                        <QuestionMarkIcon className="rotate-45 w-9 fill-rougeNoel absolute top-0 right-0 md:relative" />
                    </div>

                    <i className="py-5 block">Vous avez besoin d&apos;aide ? Des idées d&apos;amélioration du site ?</i>

                    {!isSubmitted && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                onSubmit();
                            }}
                        >
                            {' '}
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
                            </div>{' '}
                            <button type="submit" className="green-button mt-5 float-right">
                                Envoyer
                            </button>
                        </form>
                    )}

                    {isSubmitted && (
                        <div className="text-center">
                            <p className="py-2">Ton message a bien été envoyé!</p>
                            <FontAwesomeIcon icon={faCheck} className="h-6 inline" />
                            <p className="py-2">Nous te répondrons dés que possible.</p>{' '}
                            <CustomButton
                                className="green-button mt-5"
                                onClick={() => Router.push(connectedUser ? '/home' : '/')}
                            >
                                Revenir à la page principale
                            </CustomButton>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

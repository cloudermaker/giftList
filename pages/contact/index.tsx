import CustomButton from '@/components/atoms/customButton';
import { QuestionMarkIcon } from '@/components/icons/questionMark';
import { Layout } from '@/components/layout';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Router from 'next/router';
import { useState } from 'react';

export default function Help(): JSX.Element {
    const [email, setEmail] = useState<string>();
    const [message, setMessage] = useState<string>();
    const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
    const { connectedUser } = useCurrentUser();

    const onSubmit = () => {
        // todo here => call API to send email

        setIsSubmitted(true);
    };

    return (
        <Layout withHeader={false}>
            <title>Page de contact</title>
            <h1 className="header text-center bg-white">Page de contact</h1>

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
                        <form onSubmit={onSubmit}>
                            <div className="block pt-2">
                                <label className="pr-2" htmlFor="email">
                                    Votre email:
                                </label>
                                <input
                                    id="email"
                                    className="bg-transparent"
                                    type="email"
                                    placeholder="Ton email"
                                    onChange={(e) => setEmail(e.target.value)}
                                    value={email}
                                    name="email"
                                    required
                                />
                            </div>

                            <div className="block pt-2">
                                <label className="pr-2" htmlFor="message">
                                    Votre message:
                                </label>
                                <textarea
                                    id="message"
                                    className="border-2 block w-full"
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Ton message"
                                    value={message}
                                    name="message"
                                    required
                                />
                            </div>

                            <button type="submit" className="mt-5 float-right">
                                Envoyer
                            </button>
                        </form>
                    )}

                    {isSubmitted && (
                        <div className="text-center">
                            <p className="py-2">Ton message a bien été envoyé!</p>
                            <FontAwesomeIcon icon={faCheck} className="h-6 inline" />

                            <p className="py-2">Nous te répondrons dés que possible.</p>

                            <CustomButton className="mt-5" onClick={() => Router.push(connectedUser ? '/home' : '/')}>
                                Revenir à la page principale
                            </CustomButton>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}

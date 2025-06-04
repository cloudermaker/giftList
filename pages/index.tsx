import Router from 'next/router';
import { useState } from 'react';
import { Layout } from '../components/layout';
import { CustomInput } from '../components/atoms/customInput';
import CustomButton from '../components/atoms/customButton';
import { useLogin } from '@/lib/hooks/useLogin';
import SEO from '@/components/SEO';
import { generatePageSchema } from '@/lib/schema/schemaGenerators';

export default function Index(): JSX.Element {
    const { login } = useLogin();

    const [creatingGroup, setCreatingGroup] = useState<boolean>(false);
    const [joiningGroup, setJoiningGroup] = useState<boolean>(false);
    const [connectingAsAdmin, setConnectingAsAdmin] = useState<boolean>(false);

    const pageTitle = 'Créez votre liste de cadeaux en ligne gratuitement';
    const pageDescription =
        'Créez et partagez facilement une liste de cadeaux en famille ou entre amis. Service 100% gratuit, sans inscription par email. Idéal pour les fêtes, anniversaires et événements spéciaux.';

    const [groupName, setGroupName] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');

    const onCreatingButtonClick = (): void => {
        setCreatingGroup(true);

        window.setTimeout(function () {
            document.getElementById('groupNameInputId')?.focus();
        }, 0);
    };

    const onJoiningButtonClick = (): void => {
        setJoiningGroup(true);

        window.setTimeout(function () {
            document.getElementById('groupNameInputId')?.focus();
        }, 0);
    };

    const onCancelButtonClick = (): void => {
        setCreatingGroup(false);
        setJoiningGroup(false);
        setConnectingAsAdmin(false);
        setGroupName('');
        setName('');
        setPassword('');
        setError('');
    };

    const onValidateButtonClick = async (): Promise<void> => {
        setError('');
        if (!groupName) {
            setError('Il faut rentrer un groupe.');
        } else if (!name) {
            setError('Il faut rentrer un nom.');
        } else if (connectingAsAdmin && !password) {
            setError('Il faut rentrer un mot de passe.');
        } else {
            const data = await login(name, groupName, creatingGroup, password);

            if (data?.success) {
                Router.push('/home');
            } else if (data) {
                setError(data?.error ?? 'Erreur');
            }
        }
    };

    const onInputPressKey = async (keyCode: string) => {
        if (keyCode === 'Enter') {
            await onValidateButtonClick();
        }
    };

    return (
        <Layout withHeader={false}>
            <SEO
                title={pageTitle}
                description={pageDescription}
                keywords="liste de cadeaux,famille,groupe,cadeaux,gratuit,anniversaire,noël,mariage,naissance,secret"
                canonicalPath="/"
                ogImage="/BG_1.png"
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={generatePageSchema('WebPage', pageTitle, '/', pageDescription)}
            />

            <h1 className="header text-center bg-white my-8">Bienvenue sur le site de gestion de cadeaux</h1>

            {!creatingGroup && !joiningGroup && (
                <div className="block text-center">
                    <h2 className="p-5 font-bold bg-shadow">Que souhaites-tu faire ?</h2>

                    <div className="block m-3">
                        <CustomButton className="green-button p-3 mx-3" onClick={onCreatingButtonClick}>
                            Créer mon groupe
                        </CustomButton>

                        <CustomButton className="green-button p-3 mx-3 mt-3" onClick={onJoiningButtonClick}>
                            Rejoindre mon groupe
                        </CustomButton>
                    </div>
                </div>
            )}

            {(creatingGroup || joiningGroup) && (
                <div className="block text-center">
                    <div className="block m-5 p-2 bg-shadow">
                        {error && <b className="text-red-500">{`Erreur: ${error}`}</b>}

                        {creatingGroup && <p className="font-bold mb-2">Pour créer ton groupe:</p>}
                        {!creatingGroup && <p className="font-bold mb-2">Pour rejoindre un groupe:</p>}

                        <div className="input-group">
                            <label className="input-label">Entre le nom de ton groupe:</label>
                            <input
                                id="groupNameInputId"
                                className="input-field"
                                onChange={(e) => setGroupName(e.target.value)}
                                value={groupName}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Entre ton nom:</label>
                            <CustomInput
                                id="nameInputId"
                                className="input-field bg-transparent"
                                onChange={setName}
                                value={name}
                                onKeyDown={onInputPressKey}
                            />
                        </div>

                        {joiningGroup && (
                            <div className="flex py-4">
                                Je veux me connecter comme admin:
                                <input
                                    className="ml-2 cursor-pointer w-6 accent-vertNoel"
                                    type="checkbox"
                                    onChange={() => setConnectingAsAdmin((value) => !value)}
                                />
                            </div>
                        )}

                        {(connectingAsAdmin || creatingGroup) && (
                            <>
                                <div className="input-group">
                                    <label className="input-label">Mot de passe admin:</label>
                                    <CustomInput
                                        id="passwordInputId"
                                        className="input-field bg-transparent"
                                        onChange={setPassword}
                                        value={password}
                                        onKeyDown={onInputPressKey}
                                        type="password"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="block m-3">
                        <CustomButton className="p-3 mx-3 green-button" onClick={onValidateButtonClick}>
                            {"C'est parti!"}
                        </CustomButton>

                        <CustomButton className="p-3 mx-3" onClick={onCancelButtonClick}>
                            {'En fait, non'}
                        </CustomButton>
                    </div>
                </div>
            )}

            <div className="py-8 flex justify-center relative">
                <div className="bg-white w-fit h-fit rounded p-5 place-center border-vertNoel border-solid border-2">
                    <div className="flex justify-around">
                        <span className="text-4xl absolute top-0 left-0 md:relative">🎂</span>
                        <h2 className="bg-vertNoel/25 rounded-lg p-2 self-center text-center text-lg font-bold">
                            Ma liste de cadeaux en famille ou entre amis
                        </h2>
                        <span className="text-4xl absolute top-0 right-0 md:relative">🎁</span>
                    </div>

                    <h3 className="pt-5 font-bold">Pour commencer, rien de plus simple. Il te suffit de:</h3>
                    <ul className="pl-5">
                        <li className="py-2">
                            <span className="bg-vertNoel/25 rounded-full mr-3 px-2 py-1">1</span>
                            Créer un nouveau groupe
                        </li>
                        <li className="py-2">
                            <span className="bg-vertNoel/25 rounded-full mr-3 px-2 py-1">2</span>
                            Une fois connecté, tu pourras ajouter de nouveaux utilisateurs
                        </li>
                        <li className="py-2">
                            <span className="bg-vertNoel/25 rounded-full mr-3 px-2 py-1">3</span>
                            <span>Chaque utilisateur pourra se connecter avec son nom de groupe et son nom</span>
                        </li>
                    </ul>

                    <h3 className="pt-5 font-bold">Une fois connecté, tu pourras:</h3>
                    <ul className="pl-5">
                        <li className="list-disc">Ajouter les cadeaux que tu souhaites</li>
                        <li className="list-disc">Indiquer aux autres utilisateurs quel(s) cadeau(x) tu prends...</li>
                        <li className="text-center italic">... Mais sans que la personne ne soit au courant !</li>
                        <li className="list-disc">Classer tes cadeaux dans un ordre de préférence</li>
                        <li className="list-disc">Enfin, une page te résume tous les cadeaux que tu dois prendre et pour qui</li>
                        <i className="w-full block text-xs text-right">
                            Pratique pour faire les courses, tout est sur la même page!
                        </i>
                    </ul>
                </div>
            </div>
        </Layout>
    );
}

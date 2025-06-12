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

            <h1 className="header text-center font-bold my-8">🎁 Ma Liste de Cadeaux</h1>

            <section className="text-center block place-self-center pt-4">
                {!creatingGroup && !joiningGroup && (
                    <div className="block m-3">
                        <CustomButton className="green-button p-3 mx-3" onClick={onCreatingButtonClick}>
                            👥 Créer mon groupe
                        </CustomButton>

                        <CustomButton className="green-button p-3 mx-3 mt-3" onClick={onJoiningButtonClick}>
                            🚪 Rejoindre mon groupe
                        </CustomButton>
                    </div>
                )}

                {(creatingGroup || joiningGroup) && (
                    <div className="block text-center">
                        <div className="block m-5 p-2">
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
            </section>

            <section className="home-section">
                <h2 className="font-bold">🎉 Créez votre liste de cadeaux en ligne gratuitement</h2>

                <p>
                    Organisez vos échanges de cadeaux en famille ou entre amis - Simple, secret et efficace pour Noël,
                    anniversaires et toutes vos fêtes !
                </p>
            </section>

            <section className="home-section" id="comment-ca-marche">
                <h2 className="font-bold">
                    <span role="img" aria-label="cible">
                        🎯
                    </span>
                    Comment organiser vos listes de cadeaux ?
                </h2>
                <p>Pour créer votre liste de cadeaux en ligne, rien de plus simple :</p>

                <div className="flex flex-col md:flex-row justify-around items-center mt-4">
                    <div className="item md:m-4">
                        <div className="step-number">1</div>
                        <span className="step-emoji" role="img" aria-label="étincelle">
                            ✨
                        </span>
                        <h3>Créer votre groupe de cadeaux</h3>
                        <p>
                            {
                                "Lancez votre groupe familial ou entre amis pour Noël, anniversaires ou toute occasion spéciale. C'est gratuit et sans inscription compliquée !"
                            }
                        </p>
                    </div>

                    <div className="item md:m-4">
                        <div className="step-number">2</div>
                        <span className="step-emoji" role="img" aria-label="amis">
                            👫
                        </span>
                        <h3>Inviter vos proches</h3>
                        <p>
                            Une fois connecté, ajoutez vos proches à votre liste de cadeaux. Chaque personne se connecte
                            simplement avec le nom du groupe et son prénom.
                        </p>
                    </div>

                    <div className="item md:m-4">
                        <div className="step-number">3</div>
                        <span className="step-emoji" role="img" aria-label="secret">
                            🤫
                        </span>
                        <h3>Gérer les cadeaux en secret</h3>
                        <p>
                            {
                                "Ajoutez vos envies de cadeaux, réservez ceux des autres... tout en gardant le secret jusqu'au jour J! Parfait pour les surprises de Noël ou d'anniversaire."
                            }
                        </p>
                    </div>
                </div>
            </section>

            <section className="home-section">
                <h2 className="text-center font-bold">❓ Questions fréquentes sur les listes de cadeaux</h2>
                <div className="item m-4">
                    <h3 className="text-lg font-semibold" style={{ color: '#667eea', marginBottom: '10px' }}>
                        Comment créer une liste de cadeaux pour ma famille ?
                    </h3>
                    <p>
                        {
                            "Il suffit de créer un groupe, d'inviter vos proches et de commencer à ajouter vos envies de cadeaux. Chacun peut voir les listes des autres et réserver secrètement les cadeaux qu'il souhaite offrir."
                        }
                    </p>
                </div>

                <div className="item m-4">
                    <h3 className="text-lg font-semibold" style={{ color: '#667eea', marginBottom: '10px' }}>
                        Est-ce que le service est vraiment gratuit ?
                    </h3>
                    <p>
                        Oui, notre plateforme de gestion de listes de cadeaux est entièrement gratuite. Aucun abonnement, aucune
                        publicité intrusive.
                    </p>
                </div>

                <div className="item m-4">
                    <h3 className="text-lg font-semibold" style={{ color: '#667eea', marginBottom: '10px' }}>
                        Puis-je utiliser cette liste pour Noël et les anniversaires ?
                    </h3>
                    <p>
                        Absolument ! Notre outil est parfait pour organiser tous vos échanges de cadeaux : Noël, anniversaires,
                        fêtes des mères, mariages, et toute occasion spéciale.
                    </p>
                </div>
            </section>

            <section className="home-section">
                <div>
                    <h2 className="font-bold">🎈 Prêt à organiser vos prochains cadeaux ?</h2>
                    <p>
                        Rejoignez des milliers de familles qui ont simplifié leurs échanges de cadeaux grâce à notre liste en
                        ligne gratuite
                    </p>

                    <div className="mt-4">
                        <CustomButton className="green-button p-3 mx-3" onClick={onCreatingButtonClick}>
                            🚀 Créer mon groupe
                        </CustomButton>
                    </div>
                </div>
            </section>
        </Layout>
    );
}

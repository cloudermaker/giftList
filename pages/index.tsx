import Router from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { CustomInput } from '../components/atoms/customInput';
import CustomButton from '../components/atoms/customButton';
import { ErrorAlert } from '../components/atoms/ErrorAlert';
import { useLogin } from '@/lib/hooks/useLogin';
import SEO from '@/components/SEO';
import { generatePageSchema } from '@/lib/schema/schemaGenerators';

// Constants
const ERROR_MESSAGES = {
    NO_GROUP: 'Il faut rentrer un groupe.',
    NO_NAME: 'Il faut rentrer un nom.',
    NO_PASSWORD: 'Il faut rentrer un mot de passe.',
    GENERIC: 'Erreur'
} as const;

const STORAGE_KEY_GROUP = 'recentGroupName';
const STORAGE_KEY_NAME = 'recentUserName';

// Random image selection
const LOGIN_IMAGES = ['login.jpg', 'login1.jpg', 'login2.jpg'];
const getRandomLoginImage = () => LOGIN_IMAGES[Math.floor(Math.random() * LOGIN_IMAGES.length)];

export default function Index(): JSX.Element {
    const { login } = useLogin();

    // UI state consolidated
    const [mode, setMode] = useState<'creating' | 'joining'>('joining');
    const [connectingAsAdmin, setConnectingAsAdmin] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [loginImage] = useState(() => getRandomLoginImage());

    const pageTitle = 'Créez votre liste de cadeaux en ligne gratuitement';
    const pageDescription =
        'Créez et partagez facilement une liste de cadeaux en famille ou entre amis. Service 100% gratuit, sans inscription par email. Idéal pour les fêtes, anniversaires et événements spéciaux.';

    // Form data consolidated - load from localStorage on init for joining mode
    const [formData, setFormData] = useState(() => ({
        groupName: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_GROUP) || '' : '',
        name: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_NAME) || '' : '',
        password: '',
        error: ''
    }));

    // Clear form when switching to creating mode
    const handleModeChange = (newMode: 'creating' | 'joining') => {
        if (newMode === 'creating') {
            setFormData({ groupName: '', name: '', password: '', error: '' });
            setConnectingAsAdmin(false);
        } else {
            // Load from localStorage when switching to joining
            setFormData((prev) => ({
                ...prev,
                groupName: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_GROUP) || '' : '',
                name: typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_NAME) || '' : '',
                password: '',
                error: ''
            }));
            setConnectingAsAdmin(false);
        }
        setMode(newMode);
        setShowPassword(false);
    };

    const onValidateButtonClick = async (): Promise<void> => {
        setFormData((prev) => ({ ...prev, error: '' }));
        setIsLoading(true);

        try {
            if (!formData.groupName) {
                setFormData((prev) => ({ ...prev, error: ERROR_MESSAGES.NO_GROUP }));
                return;
            }
            if (!formData.name) {
                setFormData((prev) => ({ ...prev, error: ERROR_MESSAGES.NO_NAME }));
                return;
            }
            if (connectingAsAdmin && !formData.password) {
                setFormData((prev) => ({ ...prev, error: ERROR_MESSAGES.NO_PASSWORD }));
                return;
            }

            // Save to localStorage
            localStorage.setItem(STORAGE_KEY_GROUP, formData.groupName);
            localStorage.setItem(STORAGE_KEY_NAME, formData.name);

            const data = await login(formData.name, formData.groupName, mode === 'creating', formData.password);

            if (data?.success) {
                Router.push('/home');
            } else if (data) {
                setFormData((prev) => ({ ...prev, error: data?.error ?? ERROR_MESSAGES.GENERIC }));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const onInputPressKey = async (keyCode: string) => {
        if (keyCode === 'Enter') {
            await onValidateButtonClick();
        }
    };

    // Add Ctrl/Cmd + Enter shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isLoading) {
                e.preventDefault();
                onValidateButtonClick();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoading]);

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

            <section className="flex justify-center items-start pt-8 pb-12 px-4">
                <div className="w-full max-w-6xl flex gap-8 items-center">
                    {/* Form Section */}
                    <div className="w-full md:w-1/2 card-container">
                        <div
                            key={mode}
                            className={`bg-white rounded-2xl shadow-xl overflow-hidden ${mode === 'joining' ? 'animate-flip-in' : 'animate-flip-in-reverse'}`}
                        >
                            {/* Tabs */}
                            <div className="flex border-b border-gray-200">
                                <div
                                    onClick={() => !isLoading && handleModeChange('joining')}
                                    className={`flex-1 px-4 py-3 cursor-pointer transition-all text-center flex items-center justify-center ${
                                        mode === 'joining'
                                            ? 'font-semibold text-rougeNoel border-b-2 border-rougeNoel -mb-px'
                                            : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Se connecter
                                </div>
                                <div
                                    onClick={() => !isLoading && handleModeChange('creating')}
                                    className={`flex-1 px-4 py-3 cursor-pointer transition-all text-center flex items-center justify-center ${
                                        mode === 'creating'
                                            ? 'font-semibold text-vertNoel border-b-2 border-vertNoel -mb-px'
                                            : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Créer un groupe
                                </div>
                            </div>

                            {/* Header */}
                            <div className="p-6 overflow-hidden">
                                <h2 className="text-2xl font-bold text-center text-gray-800">
                                    {mode === 'creating' ? '✨ Créer ton groupe' : '🎁 Rejoindre un groupe'}
                                </h2>
                                <p className="text-sm text-gray-600 text-center mt-2">
                                    {mode === 'creating'
                                        ? 'Commencez une nouvelle liste de cadeaux pour ta famille ou tes amis'
                                        : 'Connecte-toi à un groupe existant avec ton nom ou prénom'}
                                </p>
                            </div>

                            {/* Form */}
                            <div className="p-6 space-y-4">
                                {formData.error && (
                                    <ErrorAlert
                                        message={formData.error}
                                        onClose={() => setFormData((prev) => ({ ...prev, error: '' }))}
                                    />
                                )}

                                <div className="space-y-2">
                                    <label htmlFor="groupNameInputId" className="block text-sm font-medium text-gray-700">
                                        Nom du groupe
                                    </label>
                                    <CustomInput
                                        id="groupNameInputId"
                                        className="w-full"
                                        onChange={(value) => setFormData((prev) => ({ ...prev, groupName: value }))}
                                        value={formData.groupName}
                                        onKeyDown={onInputPressKey}
                                        autoFocus
                                        disabled={isLoading}
                                        placeholder={mode === 'creating' ? 'Ex: Famille Dupont' : 'Entrez le nom du groupe'}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="nameInputId" className="block text-sm font-medium text-gray-700">
                                        Nom
                                    </label>
                                    <CustomInput
                                        id="nameInputId"
                                        className="w-full"
                                        onChange={(value) => setFormData((prev) => ({ ...prev, name: value }))}
                                        value={formData.name}
                                        onKeyDown={onInputPressKey}
                                        disabled={isLoading}
                                        placeholder="Ex: Marie"
                                    />
                                </div>

                                {mode === 'joining' && (
                                    <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer">
                                        <input
                                            id="adminCheckbox"
                                            className="cursor-pointer w-5 h-5 accent-vertNoel rounded"
                                            type="checkbox"
                                            onChange={() => setConnectingAsAdmin((value) => !value)}
                                            disabled={isLoading}
                                        />
                                        <label
                                            htmlFor="adminCheckbox"
                                            className="ml-3 text-sm font-medium text-gray-700 cursor-pointer flex-1"
                                        >
                                            Je veux me connecter comme admin
                                        </label>
                                    </div>
                                )}

                                {(connectingAsAdmin || mode === 'creating') && (
                                    <div className="space-y-2">
                                        <label htmlFor="passwordInputId" className="block text-sm font-medium text-gray-700">
                                            Mot de passe admin
                                            {mode === 'creating' && (
                                                <span className="block text-xs font-normal text-gray-500 mt-0.5">
                                                    Pour gérer le groupe
                                                </span>
                                            )}
                                        </label>
                                        <div className="relative">
                                            <CustomInput
                                                id="passwordInputId"
                                                className="w-full pr-10"
                                                onChange={(value) => setFormData((prev) => ({ ...prev, password: value }))}
                                                value={formData.password}
                                                onKeyDown={onInputPressKey}
                                                type={showPassword ? 'text' : 'password'}
                                                disabled={isLoading}
                                                placeholder={
                                                    mode === 'creating' ? 'Choisissez un mot de passe' : 'Mot de passe admin'
                                                }
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                                disabled={isLoading}
                                                tabIndex={-1}
                                                style={{
                                                    all: 'unset',
                                                    position: 'absolute',
                                                    right: '0.75rem',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                                    opacity: isLoading ? 0.5 : 1,
                                                    fontSize: '1.25rem'
                                                }}
                                            >
                                                {showPassword ? '👁️' : '👁️‍🗨️'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="p-6 bg-gray-50 flex flex-col gap-3">
                                {mode === 'joining' && (
                                    <div className="text-sm text-center">
                                        <Link href="/contact" className="text-rougeNoel hover:underline">
                                            Nom de groupe, nom ou mot de passe oublié ?
                                        </Link>
                                    </div>
                                )}

                                <CustomButton
                                    className="flex-1 p-3 green-button"
                                    onClick={onValidateButtonClick}
                                    disabled={isLoading}
                                >
                                    {isLoading ? '⏳ Chargement...' : "C'est parti!"}
                                </CustomButton>
                            </div>
                        </div>
                    </div>

                    {/* Illustration Section - Hidden on mobile */}
                    <div className="hidden md:block w-1/2">
                        <div className="relative min-h-[600px]">
                            <Image src={`/${loginImage}`} alt="Gift organization illustration" fill className="object-contain" />
                        </div>
                    </div>
                </div>
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
                        <CustomButton
                            className="green-button p-3 mx-3"
                            onClick={() => handleModeChange('creating')}
                            disabled={isLoading}
                        >
                            🚀 Créer mon groupe
                        </CustomButton>
                    </div>
                </div>
            </section>
        </Layout>
    );
}

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
import { generatePageSchema, generateFAQSchema } from '@/lib/schema/schemaGenerators';
import GiftIdeasGenerator from '@/components/GiftIdeasGenerator';

// Constants
const ERROR_MESSAGES = {
    NO_GROUP: 'Il faut rentrer un groupe.',
    NO_NAME: 'Il faut rentrer un nom.',
    NO_PASSWORD: 'Il faut rentrer un mot de passe.',
    NO_EMOJI_IN_GROUP: 'Les emojis ne sont pas autorisés dans le nom du groupe.',
    GENERIC: 'Erreur'
} as const;

const STORAGE_KEY_GROUP = 'recentGroupName';
const STORAGE_KEY_NAME = 'recentUserName';
const STORAGE_KEY_COOKIE_BANNER = 'cookieBannerDismissed';

export default function Index(): JSX.Element {
    const { login } = useLogin();

    // UI state consolidated
    const [mode, setMode] = useState<'creating' | 'joining'>('joining');
    const [connectingAsAdmin, setConnectingAsAdmin] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showCookieBanner, setShowCookieBanner] = useState(false);

    const pageTitle = 'Liste de cadeaux en ligne gratuite';
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

            // Check for emojis in group name when creating
            if (mode === 'creating') {
                const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu;
                if (emojiRegex.test(formData.groupName)) {
                    setFormData((prev) => ({ ...prev, error: ERROR_MESSAGES.NO_EMOJI_IN_GROUP }));
                    return;
                }
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

    const handleDismissCookieBanner = () => {
        localStorage.setItem(STORAGE_KEY_COOKIE_BANNER, 'true');
        setShowCookieBanner(false);
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

    // Check cookie banner status after mount (client-side only)
    useEffect(() => {
        const dismissed = localStorage.getItem(STORAGE_KEY_COOKIE_BANNER);
        if (!dismissed) {
            setShowCookieBanner(true);
        }
    }, []);

    return (
        <Layout withHeader={false}>
            <SEO 
                title={pageTitle} 
                description={pageDescription} 
                keywords="liste de cadeaux, liste cadeaux gratuite, organiser cadeaux famille, cadeaux Noël, cadeaux anniversaire, partager liste cadeaux, planifier cadeaux groupe, secret Santa, liste souhaits, gestion cadeaux en ligne"
                canonicalPath="/" 
                ogImage="/og-image-home.jpg" 
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={generatePageSchema('WebPage', pageTitle, '/', pageDescription)}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={generateFAQSchema([
                    {
                        question: "Comment créer une liste de cadeaux pour ma famille ?",
                        answer: "Il suffit de créer un groupe, d'inviter vos proches et de commencer à ajouter vos envies de cadeaux. Chacun peut voir les listes des autres et réserver secrètement les cadeaux qu'il souhaite offrir."
                    },
                    {
                        question: "Est-ce que le service est vraiment gratuit ?",
                        answer: "Oui, notre plateforme de gestion de listes de cadeaux est entièrement gratuite. Aucun abonnement, aucune publicité intrusive."
                    },
                    {
                        question: "Puis-je utiliser cette liste pour Noël et les anniversaires ?",
                        answer: "Absolument ! Notre outil est parfait pour organiser tous vos échanges de cadeaux : Noël, anniversaires, fêtes des mères, mariages, et toute occasion spéciale."
                    }
                ])}
            />

            {/* Hero Section with H1 */}
            <section className="text-center py-8 px-4">
                <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3 max-w-4xl mx-auto">
                    Liste de cadeaux en ligne gratuite
                </h1>
                <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                    Organisez vos cadeaux de Noël et anniversaires en famille
                </p>
            </section>

            <section className="flex justify-center items-start px-4">
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
                                        Prénom
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
                            <Image
                            src="/login2.jpg"
                            alt="Interface de création de liste de cadeaux en ligne - Organisez vos cadeaux en famille facilement"
                            fill
                            className="object-contain"
                            priority
                            sizes="50vw"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIRAAAQQCAgMAAAAAAAAAAAAAAQIDBBEABRIhMUH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Amk3eMp2hx7SrC5lwXFpQ2VpSQUJGgSeJPAA4HbnVF7Q9oZN3ckQ5hU6ESSVJI2oHkAcD4GtKUB//2Q=="
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Pourquoi choisir Ma liste de cadeaux */}
            <section className="home-section">
                <h2 className="font-bold">Pourquoi choisir Ma liste de cadeaux ? ✅</h2>

                <p>
                    Organisez vos échanges de cadeaux en famille ou entre amis de manière simple et efficace. Notre outil gratuit de gestion de listes de cadeaux
                    sécurisées est parfait pour <strong>Noël, anniversaires et toutes vos fêtes</strong> !
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 mb-6">
                    <div className="item bg-white p-3 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl mb-1">💰</div>
                        <div className="text-sm">
                            <strong className="block">100%</strong>
                            <span className="text-gray-600">gratuit</span>
                        </div>
                    </div>
                    <div className="item bg-white p-3 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl mb-1">🔒</div>
                        <div className="text-sm">
                            <strong className="block">Zéro</strong>
                            <span className="text-gray-600">tracking</span>
                        </div>
                    </div>
                    <div className="item bg-white p-3 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl mb-1">⚡</div>
                        <div className="text-sm">
                            <strong className="block">2 min</strong>
                            <span className="text-gray-600">chrono</span>
                        </div>
                    </div>
                    <div className="item bg-white p-3 rounded-lg border border-gray-200 text-center">
                        <div className="text-2xl mb-1">🤫</div>
                        <div className="text-sm">
                            <strong className="block">100%</strong>
                            <span className="text-gray-600">secret</span>
                        </div>
                    </div>
                </div>

                <div className="item">
                    <ul className="space-y-3 text-left">
                        <li className="flex items-start gap-3">
                            <span className="text-green-500 font-bold text-xl">✓</span>
                            <span>
                                <strong>100% gratuit</strong>
                                {" - Créez votre liste de cadeaux en ligne sans frais cachés, sans abonnement"}
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-green-500 font-bold text-xl">✓</span>
                            <span>
                                <strong>Sans inscription compliquée</strong>
                                {" - Démarrez en 2 minutes sans email. Juste un nom de groupe et votre prénom"}
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-green-500 font-bold text-xl">✓</span>
                            <span>
                                <strong>Gestion secrète et sécurisée</strong> - Les cadeaux réservés restent cachés du destinataire pour préserver la surprise
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-green-500 font-bold text-xl">✓</span>
                            <span>
                                <strong>Multi-événements</strong> - Une seule liste partagée pour tous les membres de votre groupe familial ou entre amis
                            </span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="text-green-500 font-bold text-xl">✓</span>
                            <span>
                                <strong>Accessible partout</strong> - Gérez vos listes de cadeaux sur mobile, tablette ou ordinateur
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="mt-6">
                    <CustomButton
                        className="green-button p-3"
                        onClick={() => {
                            const formSection = document.querySelector('.card-container');
                            formSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            handleModeChange('creating');
                        }}
                    >
                        🎁 Créer ma liste maintenant
                    </CustomButton>
                </div>
            </section>

            {/* SEO-optimized content section */}
            <section className="home-section">
                <h2 className="font-bold text-center text-2xl md:text-3xl mb-6">
                    🎁 La solution idéale pour vos listes de cadeaux en famille
                </h2>

                <div className="grid md:grid-cols-3 gap-6 my-6">
                    <div className="item bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-4xl mb-3">🎄</div>
                        <h3 className="text-lg font-semibold text-vertNoel mb-2">Pour Noël</h3>
                        <p className="text-gray-600 text-sm">
                            Organisez vos échanges de cadeaux de Noël en famille sans stress. Chacun indique ses envies et peut
                            réserver secrètement les cadeaux des autres.
                        </p>
                    </div>

                    <div className="item bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-4xl mb-3">🎂</div>
                        <h3 className="text-lg font-semibold text-rougeNoel mb-2">Pour les anniversaires</h3>
                        <p className="text-gray-600 text-sm">
                            {
                                "Créez une liste d'anniversaire pour ne plus jamais recevoir de doublons. Vos proches savent exactement quoi offrir !"
                            }
                        </p>
                    </div>

                    <div className="item bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-4xl mb-3">💝</div>
                        <h3 className="text-lg font-semibold text-vertNoel mb-2">Toutes occasions</h3>
                        <p className="text-gray-600 text-sm">
                            {
                                "Mariage, naissance, fête des mères... Notre outil s'adapte à toutes vos célébrations et événements spéciaux."
                            }
                        </p>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="home-section">
                <h2 className="font-bold">💬 Ils ont simplifié leurs cadeaux avec nous</h2>

                <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <div className="item bg-green-50 border-l-4 border-vertNoel p-4">
                        <p className="italic" style={{ color: '#333' }}>
                            &quot;Fini les doublons et les cadeaux ratés ! On utilise Ma liste de cadeaux depuis 2 ans.&quot;
                        </p>
                        <p className="text-sm mt-2 font-semibold text-vertNoel">— Marie, Lyon</p>
                    </div>
                    <div className="item bg-red-50 border-l-4 border-rougeNoel p-4">
                        <p className="italic" style={{ color: '#333' }}>
                            &quot;Mon oncle Jean m&apos;a enfin offert autre chose que des chaussettes ! 🧦😂&quot;
                        </p>
                        <p className="text-sm mt-2 font-semibold text-rougeNoel">— Thomas, Paris</p>
                    </div>
                    <div className="item bg-green-50 border-l-4 border-vertNoel p-4">
                        <p className="italic" style={{ color: '#333' }}>
                            &quot;Plus besoin de faire semblant d&apos;être surprise avec le 3ème grille-pain... Merci !&quot;
                        </p>
                        <p className="text-sm mt-2 font-semibold text-vertNoel">— Sophie, Bordeaux</p>
                    </div>
                    <div className="item bg-red-50 border-l-4 border-rougeNoel p-4">
                        <p className="italic" style={{ color: '#333' }}>
                            &quot;Avec 12 personnes dans la famille, cette app a sauvé notre Noël ! 🎄&quot;
                        </p>
                        <p className="text-sm mt-2 font-semibold text-rougeNoel">— Antoine, Marseille</p>
                    </div>
                </div>
            </section>

            {/* Gift Ideas Generator Section */}
            <GiftIdeasGenerator />

            <section className="home-section" id="comment-ca-marche">
                <h2 className="font-bold">
                    Comment organiser vos listes de cadeaux ? 🎯
                </h2>

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
                <h2 className="text-center font-bold">Questions fréquentes sur les listes de cadeaux ❓</h2>
                <div className="item m-4">
                    <h3 className="text-lg font-semibold" style={{ color: '#667eea', marginBottom: '10px' }}>
                        Comment créer une liste de cadeaux pour ma famille ?
                    </h3>
                    <p>
                        {"Créer une liste de cadeaux en ligne est très simple : créez un groupe, invitez vos proches et commencez à ajouter vos envies de cadeaux. "}
                        {"Chaque membre peut consulter les listes des autres et réserver secrètement les cadeaux qu'il souhaite offrir. "}
                        {"Idéal pour éviter les doublons lors des fêtes de Noël ou anniversaires en famille."}
                    </p>
                </div>

                <div className="item m-4">
                    <h3 className="text-lg font-semibold" style={{ color: '#667eea', marginBottom: '10px' }}>
                        Est-ce que le service est vraiment gratuit ?
                    </h3>
                    <p>
                        Oui ! Notre plateforme de gestion de listes de cadeaux en ligne est entièrement gratuite. Aucun abonnement,
                        aucune publicité intrusive, aucun frais caché. Vous pouvez créer autant de groupes et de listes que vous le souhaitez.
                    </p>
                </div>

                <div className="item m-4">
                    <h3 className="text-lg font-semibold" style={{ color: '#667eea', marginBottom: '10px' }}>
                        Puis-je utiliser cette liste pour Noël et les anniversaires ?
                    </h3>
                    <p>
                        Absolument ! Notre outil est parfait pour organiser tous vos échanges de cadeaux : liste de cadeaux de Noël en famille,
                        anniversaires, fêtes des mères, mariages, crémaillères, naissances et toute occasion spéciale. Une seule liste pour tous vos événements !
                    </p>
                </div>
            </section>

            {/* SEO Content Section - Long-tail keywords */}
            <section className="home-section">
                <div className="max-w-4xl mx-auto">
                    <h2 className="font-bold text-center mb-6">Simplifiez vos échanges de cadeaux en ligne</h2>
                    
                    <div className="space-y-4 item">
                        <p>
                            <strong>Organiser une liste de cadeaux en famille</strong> n&apos;a jamais été aussi simple. Que vous prépariez 
                            vos cadeaux de Noël, un anniversaire surprise ou un événement spécial, notre plateforme vous permet de 
                            <strong> partager vos idées cadeaux</strong> avec vos proches en toute sécurité.
                        </p>
                        
                        <p>
                            Plus besoin de deviner ce qui ferait plaisir ! Avec notre <strong>outil de liste de cadeaux gratuit</strong>, 
                            chacun indique ses envies et les autres peuvent réserver discrètement ce qu&apos;ils souhaitent offrir. 
                            Fini les doublons et les cadeaux qui ne plaisent pas.
                        </p>
                        
                        <p>
                            Notre système de <strong>liste de cadeaux partagée</strong> est idéal pour les grandes familles, 
                            les groupes d&apos;amis ou les équipes de travail. Créez votre groupe en moins de 2 minutes, sans inscription email, 
                            et commencez à planifier vos prochains échanges de cadeaux sereinement.
                        </p>

                        <p className="text-sm italic text-gray-600 mt-6">
                            🎁 Astuce : Pour Noël en famille, créez votre liste de cadeaux dès novembre pour laisser le temps à chacun 
                            de choisir et commander tranquillement. Votre liste reste accessible toute l&apos;année pour tous vos événements !
                        </p>
                    </div>
                </div>
            </section>

            <section className="home-section">
                <div>
                    <h2 className="font-bold">Prêt à organiser vos prochains cadeaux ? 🎈</h2>
                    <p>
                        Rejoignez des milliers de familles qui ont simplifié leurs échanges de cadeaux grâce à notre outil gratuit de liste de cadeaux en ligne.
                        Créez votre première liste maintenant et découvrez comme c&apos;est simple !
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

            {/* Cookie Banner */}
            {showCookieBanner && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center md:justify-between gap-3">
                        <div className="flex-1 text-sm text-gray-700 text-center md:text-left">
                            <p>
                                🍪 Ce site n&apos;utilise <strong>aucun cookie de tracking</strong> ni de publicité. Nous
                                utilisons uniquement le stockage local de votre navigateur pour améliorer votre expérience.
                            </p>
                        </div>
                        <button onClick={handleDismissCookieBanner} aria-label="Fermer le bandeau">
                            J&apos;ai compris
                        </button>
                    </div>
                </div>
            )}
        </Layout>
    );
}

import { Layout } from '@/components/layout';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import Link from 'next/link';
import Router from 'next/router';
import SEO from '@/components/SEO';
import { generateFAQSchema } from '@/lib/schema/schemaGenerators';
import CustomButton from '@/components/atoms/customButton';

export default function Help(): JSX.Element {
    const { connectedUser } = useCurrentUser();

    // Define FAQ items for rich results
    const faqItems = [
        {
            question: 'Combien ça coûte?',
            answer: 'Le site est entièrement gratuit.'
        },
        {
            question: "Ai-je besoin d'un mail ?",
            answer: 'Non! Nous avons souhaité faire un site simple. Tu as juste besoin de connaitre ton nom de groupe, et ton nom.'
        },
        {
            question: "J'ai oublié mon mot de passe administrateur!",
            answer: 'Contacte-nous rapidement pour pouvoir être débloqué!'
        },
        {
            question: 'Comment rajouter/supprimer des utilisateurs ?',
            answer: "Il faut être administrateur pour avoir ce droit. Si tu as un soucis, n'hésite pas à nous contacter."
        }
    ];

    return (
        <Layout withHeader={false}>
            <SEO
                title="Aide et FAQ - Créer une liste de cadeaux"
                description="Questions fréquentes sur l'utilisation de Ma liste de cadeaux - Comment créer une liste, ajouter des membres, gérer les cadeaux et plus encore."
                keywords="aide,faq,questions,liste cadeaux,comment utiliser,tutoriel"
                canonicalPath="/help"
            />
            <script type="application/ld+json" dangerouslySetInnerHTML={generateFAQSchema(faqItems)} />

            <h1 className="header text-center font-bold my-8">❓ Page d&apos;aide</h1>

            <section className="home-section">
                <h2 className="text-center font-bold">❓ Questions fréquentes sur les listes de cadeaux</h2>
                <div className="item">
                    <h3 className="text-lg font-semibold" style={{ color: '#667eea', marginBottom: '10px' }}>
                        Comment créer une liste de cadeaux pour ma famille ?
                    </h3>
                    <p>
                        {
                            "Il suffit de créer un groupe, d'inviter vos proches et de commencer à ajouter vos envies de cadeaux. Chacun peut voir les listes des autres et réserver secrètement les cadeaux qu'il souhaite offrir."
                        }
                    </p>
                </div>

                <div className="item">
                    <h3 className="text-lg font-semibold" style={{ color: '#667eea', marginBottom: '10px' }}>
                        Est-ce que le service est vraiment gratuit ?
                    </h3>
                    <p>
                        Oui, notre plateforme de gestion de listes de cadeaux est entièrement gratuite. Aucun abonnement, aucune
                        publicité intrusive.
                    </p>
                </div>

                <div className="item">
                    <h3 className="text-lg font-semibold" style={{ color: '#667eea', marginBottom: '10px' }}>
                        Puis-je utiliser cette liste pour Noël et les anniversaires ?
                    </h3>
                    <p>
                        Absolument ! Notre outil est parfait pour organiser tous vos échanges de cadeaux : Noël, anniversaires,
                        fêtes des mères, mariages, et toute occasion spéciale.
                    </p>
                </div>

                <div className="item">
                    <h3 className="text-lg font-semibold" style={{ color: '#667eea', marginBottom: '10px' }}>
                        Ai-je besoin d&apos;un mail ?
                    </h3>
                    <p>
                        Non! Nous avons souhaité faire un site simple. Tu as juste besoin de connaitre ton nom de groupe, et ton
                        nom.
                    </p>
                </div>

                <div className="item">
                    <h3 className="text-lg font-semibold" style={{ color: '#667eea', marginBottom: '10px' }}>
                        J&apos;ai oublié mon mot de passe administrateur!
                    </h3>
                    <p>
                        Ah mince,
                        <Link href={'/contact'} className="px-2">
                            contacte
                        </Link>
                        nous rapidement pour pouvoir être débloqué!
                    </p>
                </div>

                <div className="item">
                    <h3 className="text-lg font-semibold" style={{ color: '#667eea', marginBottom: '10px' }}>
                        Comment rajouter/supprimer des utilisateurs ?
                    </h3>
                    <p>
                        Il faut être administrateur pour avoir ce droit. Si tu as un soucis, n&apos;hésite pas à nous
                        <Link href={'/contact'} className="pl-2">
                            contacter
                        </Link>
                    </p>
                </div>
            </section>

            <section className="home-section">
                <h2 className="text-center font-bold">📧 Contact</h2>
                <p className="text-center">
                    Si tu as d&apos;autres questions, n&apos;hésite pas à nous
                    <Link href={'/contact'} className="px-2">
                        contacter
                    </Link>
                    ou à nous suivre sur les réseaux sociaux.
                </p>
            </section>

            <section className="home-section">
                <h2 className="text-center font-bold">🔗 Liens utiles</h2>
                <div className="flex justify-center gap-4">
                    <Link href="/terms" className="text-blue-500 hover:underline">
                        Conditions d&apos;utilisation
                    </Link>
                    <Link href="/privacy" className="text-blue-500 hover:underline">
                        Politique de confidentialité
                    </Link>
                </div>
            </section>

            <section className="text-center my-8">
                <CustomButton className="green-button mt-5" onClick={() => Router.push('/')}>
                    Retourner à l&apos;accueil
                </CustomButton>
            </section>
        </Layout>
    );
}

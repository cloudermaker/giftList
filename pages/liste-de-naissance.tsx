import { OccasionLanding } from '@/components/OccasionLanding';

export default function ListeDeNaissance(): JSX.Element {
    return (
        <OccasionLanding
            slug="/liste-de-naissance"
            emoji="👶"
            seoTitle="Liste de naissance en ligne gratuite — sans boutique imposée"
            seoDescription="Créez votre liste de naissance gratuite et multi-boutiques : ajoutez vos envies depuis n'importe quel site, partagez un lien, vos proches réservent en un clic."
            h1="Liste de naissance gratuite, libre et multi-boutiques"
            ctaLabel="👶 Créer ma liste de naissance"
            intro={[
                'Un bébé arrive et tout le monde veut aider — encore faut-il éviter trois babyphones et zéro gigoteuse. Une liste de naissance partagée guide vos proches vers ce dont vous avez vraiment besoin.',
                "Ici, pas de boutique imposée ni de commission cachée : vous listez vos envies depuis n'importe quel site (ou sans lien du tout), vous partagez le lien du groupe, et chacun réserve ce qu'il souhaite offrir."
            ]}
            sections={[
                {
                    title: 'Une liste de naissance sans enseigne imposée',
                    paragraphs: [
                        "Les listes de naissance des grandes enseignes vous enferment dans leur catalogue et prélèvent souvent une commission sur les cadeaux. Avec une liste libre, vous mélangez ce que vous voulez : la poussette repérée en magasin spécialisé, les bodys d'une petite marque, le mobile fait main sur Etsy, ou une participation pour un achat plus gros.",
                        "Chaque envie peut contenir un lien, une taille, une couleur, une description. Vos proches savent exactement quoi acheter et où — ou choisissent leur propre boutique s'ils préfèrent.",
                        "Et si la grand-mère préfère tricoter plutôt qu'acheter ? Ajoutez une idée « plaid fait main » sans lien. La liste s'adapte à votre famille, pas l'inverse."
                    ]
                },
                {
                    title: 'La réservation évite les doublons, la surprise reste',
                    paragraphs: [
                        "Quand un proche choisit un cadeau, il le réserve sur la liste : les autres voient que c'est pris et se reportent sur autre chose. Vous, futurs parents, pouvez choisir de garder la surprise en ne consultant pas les réservations — ou suivre ce qui reste à couvrir avant l'arrivée de bébé.",
                        "Contrairement à un message dans le groupe WhatsApp familial qui se perd en dix minutes, la liste reste à jour en permanence : ce qui est réservé est marqué, ce qui reste disponible est visible d'un coup d'œil."
                    ]
                },
                {
                    title: 'Simple pour toute la famille, même à distance',
                    paragraphs: [
                        "Pas de compte à créer, pas d'application à installer : vous envoyez un lien d'invitation, vos proches entrent leur prénom et voient la liste immédiatement. Que la famille soit à Paris, à Lyon ou à l'étranger, tout le monde participe de la même façon.",
                        'Le service est entièrement gratuit, sans publicité et sans revente de données. Seuls un prénom et vos idées de cadeaux sont enregistrés.'
                    ]
                }
            ]}
            faq={[
                {
                    question: 'La liste de naissance est-elle gratuite ?',
                    answer: "Oui, totalement : ni commission sur les cadeaux, ni abonnement, ni option payante. C'est un service libre financé par personne — donc qui ne vend rien."
                },
                {
                    question: 'Peut-on ajouter des articles de plusieurs boutiques ?',
                    answer: "Oui, c'est le principe : chaque envie peut pointer vers n'importe quel site marchand, ou n'avoir aucun lien. Vous n'êtes jamais limité à un catalogue."
                },
                {
                    question: 'Les invités doivent-ils créer un compte ?',
                    answer: "Non. Ils cliquent sur votre lien d'invitation, entrent leur prénom, et peuvent consulter la liste et réserver. Aucun email demandé."
                },
                {
                    question: 'Peut-on voir qui a réservé quoi ?',
                    answer: "Les membres du groupe voient qu'un cadeau est réservé pour éviter les doublons. Vous pouvez choisir de ne pas regarder pour garder la surprise jusqu'au bout."
                },
                {
                    question: 'Peut-on utiliser la liste après la naissance ?',
                    answer: 'Bien sûr : le groupe reste actif pour les anniversaires, Noël et toutes les occasions suivantes. Une seule adresse pour toutes les listes de la famille.'
                }
            ]}
        />
    );
}

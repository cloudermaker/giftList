import { OccasionLanding } from '@/components/OccasionLanding';

export default function ListeDeMariage(): JSX.Element {
    return (
        <OccasionLanding
            slug="/liste-de-mariage"
            emoji="💍"
            seoTitle="Liste de mariage en ligne gratuite — libre et sans commission"
            seoDescription="Créez votre liste de mariage en ligne gratuite : ajoutez vos envies de n'importe quelle boutique, partagez-la avec vos invités, sans commission ni enseigne imposée."
            h1="Liste de mariage en ligne, libre et sans commission"
            ctaLabel="💍 Créer ma liste de mariage"
            intro={[
                "Vos invités veulent vous gâter — autant les guider vers ce qui vous ressemble. Une liste de mariage en ligne partage vos envies en un lien, sans enseigne imposée ni commission prélevée sur vos cadeaux.",
                "Service à raclette ou week-end en amoureux, art de la table ou cagnotte pour le voyage de noces : vous composez la liste librement, vos invités réservent en quelques clics."
            ]}
            sections={[
                {
                    title: 'Une liste de mariage qui vous ressemble',
                    paragraphs: [
                        "Les listes de mariage traditionnelles imposent leur catalogue et retiennent une commission au passage. Ici, rien de tout ça : chaque envie peut pointer vers la boutique de votre choix — grande enseigne, artisan local, site de voyage — ou décrire simplement une idée (« participation au voyage de noces », « un cours de cuisine à deux »).",
                        "Vous gardez la main sur tout : les descriptions, les liens, les priorités. Les invités voient une liste claire et choisissent ce qui correspond à leur budget et à leur relation avec vous.",
                        "Un cadeau important, comme un canapé ou un voyage ? Précisez qu'il peut être offert à plusieurs : les invités s'organisent entre eux pour se regrouper."
                    ]
                },
                {
                    title: 'Simple pour vos invités, du témoin à la grand-tante',
                    paragraphs: [
                        "Vos invités n'ont ni compte à créer, ni application à installer : ils ouvrent votre lien d'invitation, entrent leur prénom, et réservent. La réservation est visible des autres invités — plus de double service à fondue — mais pas de vous, si vous préférez garder la surprise pour le jour J.",
                        "Le lien se partage partout : dans le faire-part, par email, dans le groupe WhatsApp des invités. Une seule adresse à retenir, accessible depuis n'importe quel téléphone."
                    ]
                },
                {
                    title: 'Gratuit et sans engagement, avant comme après le mariage',
                    paragraphs: [
                        "Le service est entièrement gratuit : pas de commission sur les cadeaux, pas d'abonnement, pas de frais cachés. Ce que vos invités offrent vous revient à 100 %.",
                        "Après le mariage, le groupe continue de servir : anniversaires, Noël, naissance… votre liste devient celle du foyer, et la famille garde ses habitudes."
                    ]
                }
            ]}
            faq={[
                {
                    question: 'Y a-t-il une commission sur les cadeaux ?',
                    answer: "Non, aucune. Le service est gratuit et ne touche à aucun paiement : vos invités achètent directement où ils veulent. 100 % du cadeau vous revient."
                },
                {
                    question: 'Peut-on mettre une cagnotte pour le voyage de noces ?',
                    answer: "Vous pouvez ajouter une envie « participation au voyage de noces » avec les instructions de votre choix (lien vers une cagnotte externe, enveloppe le jour J…). Le site n'encaisse pas d'argent lui-même."
                },
                {
                    question: 'Les invités voient-ils ce que les autres ont réservé ?',
                    answer: "Oui, c'est ce qui évite les doublons : un cadeau réservé apparaît comme pris pour les autres invités. Vous, les mariés, pouvez choisir de ne pas consulter les réservations pour garder la surprise."
                },
                {
                    question: 'Combien de temps la liste reste-t-elle en ligne ?',
                    answer: "Sans limite : la liste reste accessible avant, pendant et après le mariage, et le groupe peut resservir pour toutes les occasions suivantes."
                },
                {
                    question: 'Comment partager la liste avec les invités ?',
                    answer: "Un lien d'invitation unique se partage par faire-part, email ou message. L'invité clique, entre son prénom, et accède à la liste — c'est tout."
                }
            ]}
        />
    );
}

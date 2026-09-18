import { OccasionLanding } from '@/components/OccasionLanding';

export default function ListeDeNoel(): JSX.Element {
    return (
        <OccasionLanding
            slug="/liste-de-noel"
            emoji="🎄"
            seoTitle="Liste de Noël en ligne gratuite — partagée en famille"
            seoDescription="Créez votre liste de Noël en ligne gratuite et partagez-la en famille. Chacun réserve les cadeaux en secret : fini les doublons sous le sapin. Sans inscription email."
            h1="Liste de Noël en ligne, gratuite et partagée"
            ctaLabel="🎄 Créer ma liste de Noël"
            intro={[
                "Chaque année, c'est la même histoire : deux personnes offrent le même livre, le pull n'est pas à la bonne taille, et personne ne sait ce qui ferait vraiment plaisir à mamie. Une liste de Noël partagée règle tout ça en quelques minutes.",
                'Créez un groupe pour votre famille, chacun note ses envies, et les autres réservent en secret — le destinataire ne voit jamais qui a pris quoi. La magie de Noël reste intacte, les doublons disparaissent.'
            ]}
            sections={[
                {
                    title: 'Pourquoi une liste de Noël en ligne plutôt que sur papier ?',
                    paragraphs: [
                        "La liste papier se perd, s'écrit en double et ne se met jamais à jour. En ligne, votre liste est accessible à toute la famille, à tout moment, depuis un téléphone ou un ordinateur. Vous ajoutez une idée en novembre, tout le monde la voit immédiatement — même l'oncle qui vit à l'étranger.",
                        "Surtout, la réservation secrète change tout : quand quelqu'un choisit un cadeau, il le « réserve » sur la liste. Les autres voient que l'idée est prise, mais la personne concernée, elle, ne voit rien. Personne ne gâche la surprise, et personne n'achète deux fois la même chose.",
                        "Contrairement aux listes liées à une seule enseigne, vous êtes libres : ajoutez un lien vers n'importe quelle boutique, une idée sans lien, ou même « un week-end surprise ». La liste organise, elle n'impose rien."
                    ]
                },
                {
                    title: 'Parfait pour les familles nombreuses et le Secret Santa',
                    paragraphs: [
                        'Un seul groupe suffit pour toute la famille : parents, enfants, grands-parents, cousins. Chacun a sa propre liste dans le groupe, et chacun consulte celles des autres. Les enfants trop petits pour écrire ? Un parent gère leur liste pour eux.',
                        "Vous tirez les prénoms au sort pour n'offrir qu'un cadeau chacun ? La liste reste l'outil idéal : vous consultez discrètement la liste de la personne que vous avez tirée, vous réservez, et le tour est joué — sans que personne d'autre ne sache qui gâte qui."
                    ]
                },
                {
                    title: 'Gratuit, sans compte, sans publicité',
                    paragraphs: [
                        "Pas d'inscription par email, pas de mot de passe compliqué, pas de publicité. Vous créez un groupe avec un nom, vous partagez le lien d'invitation, et chacun entre simplement avec son prénom. Même les grands-parents fâchés avec l'informatique y arrivent en deux minutes.",
                        'Vos données restent les vôtres : uniquement des prénoms et des idées de cadeaux, rien de plus. Aucune revente, aucun démarchage.'
                    ]
                }
            ]}
            faq={[
                {
                    question: 'La liste de Noël est-elle vraiment gratuite ?',
                    answer: "Oui, entièrement gratuite : création du groupe, listes illimitées, réservations, invitations. Il n'y a ni abonnement, ni option payante, ni publicité."
                },
                {
                    question: 'La personne voit-elle qui a réservé son cadeau ?',
                    answer: 'Non. Sur sa propre liste, on ne voit jamais quels cadeaux sont réservés ni par qui. Seuls les autres membres du groupe voient les réservations, pour éviter les doublons.'
                },
                {
                    question: 'Faut-il créer un compte avec une adresse email ?',
                    answer: "Non. Il suffit d'un nom de groupe et d'un prénom pour se connecter. Aucun email ni mot de passe personnel n'est demandé aux membres."
                },
                {
                    question: 'Peut-on ajouter des cadeaux de n’importe quelle boutique ?',
                    answer: "Oui. Chaque cadeau peut contenir un lien vers n'importe quel site (Amazon, Fnac, petit créateur…), une description, ou juste une idée sans lien. Aucune enseigne n'est imposée."
                },
                {
                    question: 'Quand faut-il créer sa liste de Noël ?',
                    answer: "Le plus tôt possible ! Beaucoup de familles créent leur groupe en novembre pour laisser à chacun le temps de remplir sa liste et d'étaler les achats avant les fêtes."
                }
            ]}
        />
    );
}

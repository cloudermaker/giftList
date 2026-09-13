import { OccasionLanding } from '@/components/OccasionLanding';

export default function ListeAnniversaire(): JSX.Element {
    return (
        <OccasionLanding
            slug="/liste-anniversaire"
            emoji="🎂"
            seoTitle="Liste d'anniversaire en ligne gratuite — réservation secrète"
            seoDescription="Créez une liste d'anniversaire en ligne gratuite pour enfant ou adulte. Vos proches réservent les cadeaux en secret : plus de doublons, que des surprises réussies."
            h1="Liste d'anniversaire en ligne avec réservation secrète"
            ctaLabel="🎂 Créer ma liste d'anniversaire"
            intro={[
                "« Qu'est-ce qui lui ferait plaisir ? » — la question que tout le monde se pose avant chaque anniversaire. Avec une liste d'anniversaire partagée, la réponse est à un clic, et le cadeau reste une surprise.",
                'Chacun remplit sa liste d’envies dans le groupe ; avant un anniversaire, les proches la consultent et réservent en secret. La personne fêtée ne voit jamais ce qui a été choisi.'
            ]}
            sections={[
                {
                    title: "Pour les anniversaires d'enfants comme d'adultes",
                    paragraphs: [
                        "Pour un enfant : les parents tiennent la liste à jour (tailles de vêtements, jouets du moment, livres déjà lus), et grands-parents, oncles et parrains n'ont plus à deviner. Fini le troisième coffret de la même licence offert à la même fête.",
                        "Pour un adulte : on n'ose pas toujours dire ce qu'on veut. La liste le fait pour vous, avec la bonne référence, la bonne taille, le bon coloris. Vos proches choisissent librement dedans — ou s'en inspirent pour trouver mieux.",
                        "Chaque membre du groupe a sa propre liste permanente : elle vit toute l'année et sert pour chaque occasion, pas seulement le jour J."
                    ]
                },
                {
                    title: 'La réservation secrète, votre meilleure alliée',
                    paragraphs: [
                        "Quand quelqu'un réserve un cadeau sur votre liste, vous ne le voyez pas : votre liste vous semble inchangée. Les autres membres, eux, voient la réservation et évitent le doublon. Le jour de l'anniversaire, la surprise est totale — et personne n'a acheté la même chose.",
                        'Un cadeau trop cher pour une seule personne ? Indiquez-le dans la description : plusieurs proches peuvent s’organiser pour l’offrir ensemble.'
                    ]
                },
                {
                    title: 'Prêt en 2 minutes, gratuit pour toujours',
                    paragraphs: [
                        "Créez un groupe au nom de votre famille ou de votre bande d'amis, partagez le lien d'invitation, et chacun entre avec son prénom — sans email, sans mot de passe à retenir, sans application à installer.",
                        'Le service est 100 % gratuit et sans publicité. Les listes restent en ligne toute l’année : à chaque anniversaire, tout est déjà prêt.'
                    ]
                }
            ]}
            faq={[
                {
                    question: "La personne fêtée voit-elle les réservations sur sa liste ?",
                    answer: "Non, jamais. C'est le cœur du service : chacun voit les réservations sur les listes des autres, mais jamais sur la sienne. La surprise est garantie."
                },
                {
                    question: "Peut-on gérer la liste d'un enfant ?",
                    answer: "Oui : un parent ajoute l'enfant au groupe et remplit sa liste pour lui. Toute la famille peut ensuite la consulter et réserver."
                },
                {
                    question: 'Combien de personnes peuvent rejoindre le groupe ?',
                    answer: "Autant que vous voulez : famille proche, cousins, amis. Chaque membre a sa propre liste et voit celles des autres."
                },
                {
                    question: 'Faut-il refaire une liste à chaque anniversaire ?',
                    answer: "Non, c'est l'avantage : la liste est permanente. Vous l'actualisez au fil de vos envies, et elle sert pour l'anniversaire, Noël, la fête des mères…"
                },
                {
                    question: "Est-ce vraiment gratuit ?",
                    answer: 'Oui : création, invitations, réservations — tout est gratuit, sans publicité ni option premium.'
                }
            ]}
        />
    );
}

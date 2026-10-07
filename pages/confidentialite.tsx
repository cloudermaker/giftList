import { ReactNode } from 'react';
import { Layout } from '@/components/layout';
import { PageTitle } from '@/components/atoms/PageTitle';
import SEO from '@/components/SEO';
import Link from 'next/link';

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
        <div className="text-sm text-gray-700 leading-relaxed space-y-2">{children}</div>
    </section>
);

const ContactLink = () => (
    <Link href="/contact" className="text-bleuNoel hover:underline">
        page de contact
    </Link>
);

export default function Confidentialite(): JSX.Element {
    return (
        <Layout withHeader={false}>
            <SEO
                title="Politique de confidentialité"
                description="Politique de confidentialité de Ma liste de cadeaux : données collectées, cookies, durée de conservation et vos droits."
                canonicalPath="/confidentialite"
            />
            <div className="max-w-3xl mx-auto py-8">
                <PageTitle>Politique de confidentialité</PageTitle>

                <Section title="Responsable du traitement">
                    <p>
                        Le site est édité à titre personnel et non commercial (voir les{' '}
                        <Link href="/mentions-legales" className="text-bleuNoel hover:underline">
                            mentions légales
                        </Link>
                        ). Pour toute question sur vos données : <ContactLink />.
                    </p>
                </Section>

                <Section title="Données collectées et pourquoi">
                    <p>
                        Le service fonctionne <strong>sans compte</strong>. Nous enregistrons uniquement ce que vous saisissez :
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>
                            <strong>Nom du groupe, prénoms, listes de cadeaux et réservations</strong> : nécessaires pour fournir
                            le service que vous utilisez (base légale : exécution du service).
                        </li>
                        <li>
                            <strong>Email de secours (facultatif)</strong>, saisi ou récupéré via Google : uniquement pour vous
                            envoyer un lien de connexion en cas d&apos;oubli (base légale : votre consentement, que vous retirez
                            en supprimant l&apos;email depuis votre profil). Avec Google, seule l&apos;adresse email est
                            récupérée.
                        </li>
                        <li>
                            <strong>Messages du formulaire de contact</strong> : uniquement pour vous répondre (base légale :
                            intérêt légitime à traiter votre demande).
                        </li>
                    </ul>
                    <p>
                        Le mot de passe administrateur d&apos;un groupe est stocké sous forme d&apos;empreinte chiffrée,
                        illisible.
                    </p>
                </Section>

                <Section title="Qui voit vos données">
                    <p>
                        Les listes sont visibles par les personnes qui connaissent le nom de votre groupe ou disposent d&apos;un
                        lien d&apos;invitation — c&apos;est le principe du service. Votre email, lui, n&apos;est jamais montré aux
                        autres membres.
                    </p>
                    <p>
                        Vos données ne sont ni vendues ni cédées. Elles sont traitées pour notre compte par des prestataires
                        techniques : <strong>Vercel</strong> (hébergement du site), <strong>Neon</strong> (base de données,
                        stockée dans l&apos;Union européenne), <strong>MailerSend</strong> (envoi des emails) et, si vous
                        l&apos;utilisez, <strong>Google</strong> (connexion). Vercel, Neon et Google sont des sociétés américaines
                        : ces transferts sont encadrés par les garanties prévues par le RGPD (cadre de protection des données
                        UE–États-Unis ou clauses contractuelles types de la Commission européenne).
                    </p>
                </Section>

                <Section title="Durée de conservation">
                    <ul className="list-disc pl-5 space-y-1">
                        <li>
                            <strong>Groupes</strong> : supprimés automatiquement après{' '}
                            <strong>3 ans sans aucune connexion</strong>, avec leurs membres, listes et emails.
                        </li>
                        <li>
                            <strong>Suppression manuelle</strong> d&apos;un membre ou d&apos;un groupe : définitive et immédiate,
                            listes et email compris.
                        </li>
                        <li>
                            <strong>Email de secours</strong> : tant que vous le gardez sur votre profil.
                        </li>
                        <li>
                            <strong>Liens de connexion envoyés par email</strong> : valables 30 minutes (24 h pour la confirmation
                            d&apos;adresse), puis effacés chaque semaine.
                        </li>
                        <li>
                            <strong>Messages de contact</strong> : au plus 1 an.
                        </li>
                    </ul>
                </Section>

                <Section title="Cookies et mesure d'audience">
                    <p>
                        Le site n&apos;utilise <strong>aucun cookie publicitaire</strong>. Un cookie technique conserve votre
                        connexion au groupe (il ne nécessite pas de consentement), et le stockage local du navigateur mémorise vos
                        préférences d&apos;affichage.
                    </p>
                    <p>
                        La fréquentation et la rapidité du site sont mesurées avec <strong>Vercel Analytics</strong> et{' '}
                        <strong>Speed Insights</strong>, des outils sans cookie qui ne collectent aucune donnée permettant de vous
                        identifier.
                    </p>
                </Section>

                <Section title="Vos droits">
                    <p>
                        Conformément au RGPD, vous pouvez demander l&apos;accès, la rectification, la suppression ou la
                        portabilité des données vous concernant, ou vous opposer à leur traitement, via la <ContactLink />. Vous
                        pouvez aussi retirer votre email vous-même depuis votre profil, et un administrateur de groupe peut
                        renommer ou supprimer les membres directement depuis le site.
                    </p>
                    <p>
                        Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la{' '}
                        <a
                            href="https://www.cnil.fr/fr/plaintes"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-bleuNoel hover:underline"
                        >
                            CNIL
                        </a>
                        .
                    </p>
                </Section>
            </div>
        </Layout>
    );
}

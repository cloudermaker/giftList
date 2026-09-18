import { Layout } from '@/components/layout';
import SEO from '@/components/SEO';
import Link from 'next/link';

export default function Confidentialite(): JSX.Element {
    return (
        <Layout withHeader={false}>
            <SEO
                title="Politique de confidentialité"
                description="Politique de confidentialité de Ma liste de cadeaux : données collectées, cookies, durée de conservation et vos droits."
                canonicalPath="/confidentialite"
            />
            <div className="max-w-3xl mx-auto py-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-8">Politique de confidentialité</h1>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Données collectées</h2>
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">
                        Le service fonctionne <strong>sans compte ni adresse email</strong>. Les seules données enregistrées sont
                        celles que vous saisissez : le nom du groupe, les prénoms des membres et le contenu des listes de cadeaux
                        (noms, descriptions, liens).
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        Si vous utilisez le formulaire de contact, votre adresse email est utilisée uniquement pour vous répondre.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Cookies et mesure d&apos;audience</h2>
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">
                        Le site n&apos;utilise <strong>aucun cookie publicitaire</strong>. Un cookie technique conserve votre
                        connexion au groupe, et le stockage local du navigateur mémorise vos préférences d&apos;affichage.
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        La fréquentation est mesurée avec <strong>Vercel Analytics</strong>, un outil sans cookie qui ne collecte
                        aucune donnée permettant de vous identifier.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Partage et conservation</h2>
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">
                        Vos données ne sont ni vendues ni transmises à des tiers. Elles sont visibles par les personnes qui
                        connaissent le nom de votre groupe ou disposent d&apos;un lien d&apos;invitation — c&apos;est le principe
                        du service.
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        Les données sont conservées tant que le groupe existe. La suppression d&apos;un membre ou d&apos;un groupe
                        est définitive et immédiate.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Vos droits</h2>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        Conformément au RGPD, vous pouvez demander l&apos;accès, la rectification ou la suppression des données
                        vous concernant (votre prénom, vos listes, votre groupe) via la{' '}
                        <Link href="/contact" className="text-bleuNoel hover:underline">
                            page de contact
                        </Link>
                        . Un administrateur de groupe peut aussi renommer ou supprimer les membres directement depuis le site.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Éditeur</h2>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        Voir les{' '}
                        <Link href="/mentions-legales" className="text-bleuNoel hover:underline">
                            mentions légales
                        </Link>
                        .
                    </p>
                </section>
            </div>
        </Layout>
    );
}

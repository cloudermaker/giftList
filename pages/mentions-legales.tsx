import { Layout } from '@/components/layout';
import SEO from '@/components/SEO';
import Link from 'next/link';

export default function MentionsLegales(): JSX.Element {
    return (
        <Layout withHeader={false}>
            <SEO
                title="Mentions légales"
                description="Mentions légales du site Ma liste de cadeaux : éditeur, hébergement et conditions d'utilisation."
                canonicalPath="/mentions-legales"
            />
            <div className="max-w-3xl mx-auto py-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-8">Mentions légales</h1>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Éditeur du site</h2>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        Le site <strong>malistedecadeaux.fr</strong> est un service gratuit édité à titre personnel (PLR).
                        Pour toute question, utilisez la <Link href="/contact" className="text-bleuNoel hover:underline">page de contact</Link>.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Hébergement</h2>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        Le site est hébergé par <strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis
                        (<a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-bleuNoel hover:underline">vercel.com</a>).
                        Les données sont stockées sur <strong>Neon</strong> (base de données PostgreSQL hébergée dans l&apos;Union européenne).
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Conditions d&apos;utilisation</h2>
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">
                        Le service est fourni gratuitement, sans garantie de disponibilité ni d&apos;absence d&apos;erreur.
                        Chaque groupe est accessible à toute personne qui en connaît le nom : n&apos;y déposez aucune information sensible.
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        L&apos;éditeur se réserve le droit de supprimer tout contenu illicite ou tout groupe inactif.
                        Les liens vers des sites marchands ajoutés par les utilisateurs restent sous leur responsabilité.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">Données personnelles</h2>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        Voir notre <Link href="/confidentialite" className="text-bleuNoel hover:underline">politique de confidentialité</Link>.
                    </p>
                </section>
            </div>
        </Layout>
    );
}

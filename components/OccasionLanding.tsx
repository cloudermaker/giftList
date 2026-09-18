import Link from 'next/link';
import Router from 'next/router';
import { Layout } from '@/components/layout';
import SEO from '@/components/SEO';
import CustomButton from '@/components/atoms/customButton';
import { generateFAQSchema, generatePageSchema } from '@/lib/schema/schemaGenerators';

export type TOccasionFaq = { question: string; answer: string };
export type TOccasionSection = { title: string; paragraphs: string[] };

export type TOccasionLandingProps = {
    slug: string;
    emoji: string;
    seoTitle: string;
    seoDescription: string;
    h1: string;
    intro: string[];
    sections: TOccasionSection[];
    faq: TOccasionFaq[];
    ctaLabel: string;
};

const OTHER_OCCASIONS = [
    { slug: '/liste-de-noel', emoji: '🎄', label: 'Liste de Noël' },
    { slug: '/liste-de-naissance', emoji: '👶', label: 'Liste de naissance' },
    { slug: '/liste-anniversaire', emoji: '🎂', label: "Liste d'anniversaire" },
    { slug: '/liste-de-mariage', emoji: '💍', label: 'Liste de mariage' }
];

export const OccasionLanding = (props: TOccasionLandingProps): JSX.Element => {
    const { slug, emoji, seoTitle, seoDescription, h1, intro, sections, faq, ctaLabel } = props;
    const goToCreate = () => Router.push('/');

    return (
        <Layout withHeader={false}>
            <SEO title={seoTitle} description={seoDescription} canonicalPath={slug} />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={generatePageSchema('WebPage', seoTitle, slug, seoDescription)}
            />
            <script type="application/ld+json" dangerouslySetInnerHTML={generateFAQSchema(faq)} />

            <article className="max-w-3xl mx-auto py-8">
                {/* Hero */}
                <header className="text-center mb-10">
                    <div className="text-5xl mb-4" role="img" aria-hidden="true">
                        {emoji}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">{h1}</h1>
                    {intro.map((p, i) => (
                        <p key={i} className="text-gray-600 leading-relaxed mb-3">
                            {p}
                        </p>
                    ))}
                    <div className="mt-6">
                        <CustomButton className="green-button" onClick={goToCreate}>
                            {ctaLabel}
                        </CustomButton>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">Gratuit · Sans email · Prêt en 2 minutes</p>
                </header>

                {/* Comment ça marche */}
                <section className="mb-10">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Comment ça marche ?</h2>
                    <div className="grid md:grid-cols-3 gap-4 text-center">
                        <div className="item bg-white p-5 rounded-xl">
                            <p className="text-2xl mb-2">1️⃣</p>
                            <p className="text-sm text-gray-600">
                                Créez votre groupe avec le nom de votre famille ou de vos amis — aucun compte ni email demandé.
                            </p>
                        </div>
                        <div className="item bg-white p-5 rounded-xl">
                            <p className="text-2xl mb-2">2️⃣</p>
                            <p className="text-sm text-gray-600">
                                Chacun rejoint le groupe avec son prénom et remplit sa liste de cadeaux, avec liens et
                                descriptions.
                            </p>
                        </div>
                        <div className="item bg-white p-5 rounded-xl">
                            <p className="text-2xl mb-2">3️⃣</p>
                            <p className="text-sm text-gray-600">
                                Les proches réservent en secret : le concerné ne voit jamais qui a pris quoi. Fini les doublons !
                            </p>
                        </div>
                    </div>
                </section>

                {/* Sections de contenu */}
                {sections.map((section) => (
                    <section key={section.title} className="mb-10">
                        <h2 className="text-xl font-bold text-gray-800 mb-3">{section.title}</h2>
                        {section.paragraphs.map((p, i) => (
                            <p key={i} className="text-gray-600 leading-relaxed mb-3">
                                {p}
                            </p>
                        ))}
                    </section>
                ))}

                {/* FAQ */}
                <section className="mb-10">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Questions fréquentes</h2>
                    {faq.map((item) => (
                        <details key={item.question} className="item bg-white rounded-xl p-4 mb-3">
                            <summary className="font-semibold text-gray-800 cursor-pointer">{item.question}</summary>
                            <p className="text-sm text-gray-600 leading-relaxed mt-2">{item.answer}</p>
                        </details>
                    ))}
                </section>

                {/* CTA final */}
                <section className="text-center mb-10">
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Prêt à commencer ?</h2>
                    <CustomButton className="green-button" onClick={goToCreate}>
                        {ctaLabel}
                    </CustomButton>
                </section>

                {/* Maillage interne */}
                <nav className="border-t border-neutral-200 pt-6 text-center">
                    <p className="text-sm text-gray-500 mb-3">Une autre occasion ?</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {OTHER_OCCASIONS.filter((o) => o.slug !== slug).map((o) => (
                            <Link key={o.slug} href={o.slug} className="text-sm text-bleuNoel hover:underline">
                                {o.emoji} {o.label}
                            </Link>
                        ))}
                    </div>
                </nav>
            </article>
        </Layout>
    );
};

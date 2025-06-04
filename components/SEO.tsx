import Head from 'next/head';

interface SEOProps {
    title?: string;
    description?: string;
    keywords?: string;
    ogType?: string;
    ogImage?: string;
    canonicalPath?: string;
    noIndex?: boolean;
}

export default function SEO({
    title = 'Ma liste de cadeaux',
    description = 'Créé ta liste de cadeaux en famille ou entre amis facilement et gratuitement. Indique les cadeaux que tu prends sans que le concerné soit au courant!',
    keywords = 'liste de cadeaux,famille,groupe,cadeaux,gratuit,acheter pour qui',
    ogType = 'website',
    ogImage = '',
    canonicalPath = '',
    noIndex = false
}: SEOProps) {
    const siteName = 'Ma liste de cadeaux';
    const siteUrl = 'https://www.malistedecadeaux.fr';
    const fullTitle = `${title}${title !== siteName ? ` | ${siteName}` : ''}`;
    const fullCanonicalUrl = canonicalPath ? `${siteUrl}${canonicalPath}` : siteUrl;

    return (
        <Head>
            {/* Basic Meta Tags */}
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            {noIndex ? <meta name="robots" content="noindex, nofollow" /> : <meta name="robots" content="index, follow" />}
            <meta name="author" content="PLR" />

            {/* Open Graph Tags */}
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:type" content={ogType} />
            <meta property="og:url" content={fullCanonicalUrl} />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:locale" content="fr" />
            {ogImage && <meta property="og:image" content={`${siteUrl}${ogImage}`} />}

            {/* Twitter Card Tags */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={fullTitle} />
            <meta name="twitter:description" content={description} />
            {ogImage && <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />}

            {/* Canonical Link */}
            <link rel="canonical" href={fullCanonicalUrl} />

            {/* Favicon */}
            <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        </Head>
    );
}

import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

import Router from 'next/router';
import NProgress from 'nprogress';

//Route Events.
Router.events.on('routeChangeStart', () => {
    NProgress.start();
    NProgress.set(0.4);
});
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

const addJsonLd = () => {
    return {
        __html: `
        {
            "@context": "http://schema.org/",
            "@type": "Organization",
            "name": "Ma liste de cadeaux",
            "url": "https://www.malistedecadeaux.fr/",
            "logo": "https://www.malistedecadeaux.fr/favicon.ico",
            "foundingDate": "2022",
            "founders": [
                {
                    "@type": "Person",
                    "name": "Pierre Le Rendu"
                }
            ],
            "address": {
                "@type": "PostalAddress",
                "postalCode": "75000",
                "addressCountry": "FR"
            },
            "description": "Créé ta liste de cadeaux en famille ou entre amis facilement et gratuitement. Indique les cadeaux que tu prends sans que le concerné soit au courant!",
            "keywords": "liste de cadeaux, famille, groupe, cadeaux, gratuit, acheter pour qui",
            "sameAs": [
                "https://www.facebook.com/malistedecadeaux",
                "https://twitter.com/malistedecadeaux"
            ]
          }
      `
    };
};

export default function App({ Component, pageProps }: AppProps) {
    NProgress.configure({ showSpinner: true });

    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="author" content="PLR" />
                <meta name="robots" content="index, follow" />
                <meta
                    name="keywords"
                    content="liste de cadeaux,famille,groupe,cadeaux,gratuit,acheter pour qui,anniversaire,noël"
                />
                <meta
                    name="description"
                    content="Créé ta liste de cadeaux en famille ou entre amis facilement et gratuitement. 
                    Indique les cadeaux que tu prends sans que le concerné soit au courant!"
                />

                {/* Open Graph Tags */}
                <meta property="og:locale" content="fr" />
                <meta property="og:title" content="Ma liste de cadeaux" />
                <meta property="og:url" content="https://www.malistedecadeaux.fr/" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="Ma liste de cadeaux" />
                <meta
                    property="og:description"
                    content="Créé ta liste de cadeaux en famille ou entre amis facilement et gratuitement. 
                    Indique les cadeaux que tu prends sans que le concerné soit au courant!"
                />
                <meta property="og:image" content="https://www.malistedecadeaux.fr/og-image.jpg" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Ma liste de cadeaux" />
                <meta
                    name="twitter:description"
                    content="Créé ta liste de cadeaux en famille ou entre amis facilement et gratuitement."
                />
                <meta name="twitter:image" content="https://www.malistedecadeaux.fr/og-image.jpg" />

                {/* PWA Support */}
                <meta name="theme-color" content="#D42A37" />
                <link rel="manifest" href="/manifest.json" />
                <link rel="apple-touch-icon" href="/icons/icon-192.png" />

                <title>Ma liste de cadeaux</title>
                <link rel="icon" type="image/x-icon" href="/favicon.ico" />
                <link rel="canonical" href="https://malistedecadeaux.fr/" />
                <script type="application/ld+json" dangerouslySetInnerHTML={addJsonLd()} key="item-jsonld" />
            </Head>

            <Component {...pageProps} />
        </>
    );
}

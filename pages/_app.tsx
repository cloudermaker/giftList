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
            "name": "MLDC",
            "url": "https://www.malistedecadeaux.fr/",
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
            "keywords": "liste de cadeaux", 
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
                <meta name="keywords" content="liste de cadeaux;famille;groupe;cadeaux;gratuit;acheter pour qui;" />
                <meta
                    name="description"
                    content="Créé ta liste de cadeaux en famille ou entre amis facilement et gratuitement. 
                    Indique les cadeaux que tu prends sans que le concerné soit au courant!"
                />

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

                <title>Ma liste de cadeaux</title>
                <link rel="icon" type="image/x-icon" href="/favicon.ico" />
                <link rel="canonical" href="https://malistedecadeaux.fr/" />
                <script type="application/ld+json" dangerouslySetInnerHTML={addJsonLd()} key="item-jsonld" />
            </Head>

            <Component {...pageProps} />
        </>
    );
}

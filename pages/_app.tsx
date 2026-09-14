import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { UserProvider } from '@/lib/context/UserContext';

import Router from 'next/router';
import NProgress from 'nprogress';
// Import NProgress CSS for styling the loading bar
import 'nprogress/nprogress.css';

//Route Events for NProgress loading indicator
Router.events.on('routeChangeStart', () => {
    NProgress.start();
});
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

NProgress.configure({
    showSpinner: false,
    trickleSpeed: 200,
    minimum: 0.1,
    easing: 'ease',
    speed: 300
});

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
                "postalCode": "75001",
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
    return (
        <>
            <Head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <meta name="author" content="PLR" />
                <meta
                    name="description"
                    content="Créé ta liste de cadeaux en famille ou entre amis facilement et gratuitement. Indique les cadeaux que tu prends sans que le concerné soit au courant!"
                />

                {/* Per-page title/description/OG/canonical live in components/SEO.tsx */}

                {/* PWA Support */}
                <meta name="theme-color" content="#D42A37" />
                <link rel="manifest" href="/manifest.json" crossOrigin="use-credentials" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

                <title>Ma liste de cadeaux</title>
                <link rel="icon" type="image/x-icon" href="/favicon.ico" />
                <script type="application/ld+json" dangerouslySetInnerHTML={addJsonLd()} key="item-jsonld" />
            </Head>

            <UserProvider>
                <Component {...pageProps} />
            </UserProvider>
            <Analytics />
            <SpeedInsights />
        </>
    );
}

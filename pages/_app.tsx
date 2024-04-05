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
                    Indique les cadeaux que tu prends sans que le concerné soit au courant!
                    Tu peux également voir la liste des cadeaux que tu dois acheter et pour qui."
                />

                <meta property="og:locale" content="fr" />
                <meta property="og:title" content="Ma liste de cadeaux" />
                <meta property="og:url" content="https://www.malistedecadeaux.fr/" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="Ma liste de cadeaux" />
                <meta
                    property="og:description"
                    content="Créé ta liste de cadeaux en famille ou entre amis facilement et gratuitement. 
                    Indique les cadeaux que tu prends sans que le concerné soit au courant!
                    Tu peux également voir la liste des cadeaux que tu dois acheter et pour qui."
                />

                <title>Ma liste de cadeaux</title>
            </Head>

            <Component {...pageProps} />
        </>
    );
}

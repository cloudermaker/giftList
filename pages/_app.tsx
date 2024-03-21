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
                <meta
                    name="description"
                    content="Créé ta liste de cadeaux en famille ou entre amis facilement et gratuitement. Indique les cadeaux que tu prends sans que le concerné soit au courant!"
                />
                <title>Ma Liste de cadeaux</title>
            </Head>

            <Component {...pageProps} />
        </>
    );
}

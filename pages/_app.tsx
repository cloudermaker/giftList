import '../styles/globals.css'
import type { AppProps } from 'next/app';
import Head from 'next/head';

import Router from 'next/router';
import NProgress from 'nprogress';

//Route Events. 
Router.events.on('routeChangeStart', () => {
  console.log('coucou toi');
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
        <title>Gift List</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <Component {...pageProps} />
    </>
  );
}

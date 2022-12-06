import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router';
import Head from 'next/head';

export const isSSR = typeof window === 'undefined';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Gift List 2</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <Component {...pageProps} />
    </>
  );
}

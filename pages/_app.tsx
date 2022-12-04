import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router';
import Head from 'next/head';

export const isSSR = typeof window === 'undefined';

export default function App({ Component, pageProps }: AppProps) {
  /*
  const router = useRouter();

  const subdomainPaths = {
    request: '/request',
    company: '/company',
  };

  const isSubdomainRoute = () => {
    const paths = Object.values(subdomainPaths).filter((path) => router.pathname.startsWith(path));
    return !!paths.length;
  };

  if (!isSSR) {
    if (window.location.host.includes('gift-list') && !isSubdomainRoute()) {
      // show 404 or redirect somewhere else
      return <div>404 - not found</div>;
    }
  }

  // otherwise fallthrough to the normal Next.js return
  */

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

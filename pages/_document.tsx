import { Html, Head, Main, NextScript } from 'next/document';
import { themeInitScript } from '@/lib/ui/theme';

export default function Document() {
    return (
        <Html lang="fr" suppressHydrationWarning>
            <Head>
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}

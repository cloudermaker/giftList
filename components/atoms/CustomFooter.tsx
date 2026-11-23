import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useState } from 'react';
import { FacebookIcon } from '../icons/facebook';
import { TwitterIcon } from '../icons/twitter';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import jsonPackage from '@/package.json';

const FooterLink = ({ href, emoji, children }: { href: string; emoji: string; children: ReactNode }) => (
    <Link
        href={href}
        className="flex items-center text-sm font-medium text-fg-soft hover:text-rougeNoel active:scale-95 transition-all duration-300"
    >
        <span className="mr-1.5">{emoji}</span>
        {children}
    </Link>
);

const SocialLink = ({ href, children }: { href: string; children: ReactNode }) => (
    <Link
        href={href}
        className="p-2 rounded-full bg-surface/30 hover:bg-surface/50 transition-all duration-300 hover:scale-110 active:scale-95"
        target="_blank"
        rel="noopener noreferrer"
    >
        {children}
    </Link>
);

export const CustomFooter = () => {
    const { connectedUser } = useCurrentUser();
    const { asPath, isReady } = useRouter();
    // Page d'origine transmise au support, calculée côté client (asPath SSR = motif de route sur les pages statiques)
    const [contactHref, setContactHref] = useState('/contact');
    useEffect(() => {
        if (!isReady) return;
        const path = asPath.split(/[?#]/)[0];
        setContactHref(path.startsWith('/contact') ? '/contact' : `/contact?from=${encodeURIComponent(path)}`);
    }, [asPath, isReady]);

    return (
        <footer className="mt-auto inset-x-0 bottom-0 border-t border-line">
            <div className="container mx-auto max-w-5xl px-4 py-6">
                <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
                    {/* Bloc gauche : tous les liens, sur plusieurs lignes si besoin */}
                    <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 md:flex-1 md:gap-x-6">
                        <FooterLink href={connectedUser ? '/home' : '/'} emoji="🏠">
                            Accueil
                        </FooterLink>
                        <FooterLink href={contactHref} emoji="✉️">
                            Nous contacter
                        </FooterLink>
                        <FooterLink href="/help" emoji="❓">
                            Aide
                        </FooterLink>
                        <FooterLink href="/ideas" emoji="💡">
                            Idées
                        </FooterLink>
                        <FooterLink href="/mentions-legales" emoji="⚖️">
                            Mentions légales
                        </FooterLink>
                        <FooterLink href="/confidentialite" emoji="🔒">
                            Confidentialité
                        </FooterLink>
                        {connectedUser && (
                            <FooterLink href="/backoffice" emoji="⚙️">
                                Backoffice
                            </FooterLink>
                        )}
                    </nav>

                    {/* Bloc droit : réseaux + copyright + version, jamais compressé */}
                    <div className="flex flex-col items-center gap-6 md:flex-row md:shrink-0">
                        <div className="flex gap-3">
                            <SocialLink href="https://www.facebook.com/malistedecadeaux">
                                <FacebookIcon className="w-5 text-fg-muted hover:text-rougeNoel" />
                            </SocialLink>
                            <SocialLink href="https://twitter.com/malistedecadeaux">
                                <TwitterIcon className="w-5 text-fg-muted hover:text-rougeNoel" />
                            </SocialLink>
                        </div>
                        <div className="text-sm text-fg-muted flex items-center whitespace-nowrap">
                            <span className="mr-2">🎁</span>
                            <span className="hidden md:inline">Copyright&nbsp;</span>© {new Date().getFullYear()} PLR
                            <Link
                                href="/changelog"
                                className="ml-2 px-2 py-0.5 rounded-full bg-surface/30 text-xs text-vertNoel hover:bg-surface/50 transition-all"
                            >
                                v{jsonPackage.version}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

import Link from 'next/link';
import { FacebookIcon } from '../icons/facebook';
import { TwitterIcon } from '../icons/twitter';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import jsonPackage from '@/package.json';

export const CustomFooter = (): JSX.Element => {
    const { connectedUser } = useCurrentUser();

    return (
        <footer className="mt-auto inset-x-0 bottom-0 bg-gradient-to-r from-vertNoel/5 to-rougeNoel/5 border-t border-neutral-100">
            <div className="container mx-auto max-w-5xl px-4 py-6">
                {/* Mobile Layout */}
                <div className="flex flex-col items-center gap-6 md:hidden">
                    {/* Navigation Links */}
                    <nav className="flex flex-wrap justify-center gap-5">
                        <Link
                            href={connectedUser ? '/home' : '/'}
                            className="flex items-center text-sm font-medium text-neutral-700 hover:text-rougeNoel active:scale-95 transition-all duration-300"
                        >
                            <span className="mr-1.5">🏠</span>
                            Accueil
                        </Link>
                        <Link
                            href="/contact"
                            className="flex items-center text-sm font-medium text-neutral-700 hover:text-rougeNoel active:scale-95 transition-all duration-300"
                        >
                            <span className="mr-1.5">✉️</span>
                            Nous contacter
                        </Link>
                        <Link
                            href="/help"
                            className="flex items-center text-sm font-medium text-neutral-700 hover:text-rougeNoel active:scale-95 transition-all duration-300"
                        >
                            <span className="mr-1.5">❓</span>
                            Aide
                        </Link>
                    </nav>

                    {/* Social Links */}
                    <div className="flex gap-4">
                        <Link
                            href={'https://www.facebook.com/'}
                            className="p-2 rounded-full bg-white/30 hover:bg-white/50 transition-all duration-300 hover:scale-110 active:scale-95"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <FacebookIcon className="w-5 text-neutral-600 hover:text-rougeNoel" />
                        </Link>
                        <Link
                            href={'https://www.twitter.com/'}
                            className="p-2 rounded-full bg-white/30 hover:bg-white/50 transition-all duration-300 hover:scale-110 active:scale-95"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <TwitterIcon className="w-5 text-neutral-600 hover:text-rougeNoel" />
                        </Link>
                    </div>

                    {/* Copyright */}
                    <div className="text-center">
                        <div className="flex items-center justify-center text-sm text-neutral-600">
                            <span className="mr-2">🎁</span>
                            <span className="hidden sm:inline">
                                Copyright © {new Date().getFullYear()} PLR. All rights reserved.
                            </span>
                            <span className="sm:hidden">© {new Date().getFullYear()} PLR</span>
                        </div>
                        <div className="text-xs text-neutral-500 mt-1">
                            Version <span className="text-vertNoel">{jsonPackage.version}</span>
                        </div>
                    </div>
                </div>

                {/* Desktop Layout - Applied with sm: breakpoint */}
                <div className="hidden sm:flex sm:flex-row sm:justify-between sm:items-center">
                    {/* Navigation Links */}
                    <nav className="flex gap-8">
                        <Link
                            href={connectedUser ? '/home' : '/'}
                            className="flex items-center text-sm font-medium text-neutral-700 hover:text-rougeNoel active:scale-95 transition-all duration-300"
                        >
                            <span className="mr-1.5">🏠</span>
                            Accueil
                        </Link>
                        <Link
                            href="/contact"
                            className="flex items-center text-sm font-medium text-neutral-700 hover:text-rougeNoel active:scale-95 transition-all duration-300"
                        >
                            <span className="mr-1.5">✉️</span>
                            Nous contacter
                        </Link>
                        <Link
                            href="/help"
                            className="flex items-center text-sm font-medium text-neutral-700 hover:text-rougeNoel active:scale-95 transition-all duration-300"
                        >
                            <span className="mr-1.5">❓</span>
                            Aide
                        </Link>
                    </nav>

                    {/* Social Links and Copyright */}
                    <div className="flex items-center gap-6">
                        <div className="flex gap-3">
                            <Link
                                href={'https://www.facebook.com/'}
                                className="p-2 rounded-full bg-white/30 hover:bg-white/50 transition-all duration-300 hover:scale-110 active:scale-95"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <FacebookIcon className="w-5 text-neutral-600 hover:text-rougeNoel" />
                            </Link>
                            <Link
                                href={'https://www.twitter.com/'}
                                className="p-2 rounded-full bg-white/30 hover:bg-white/50 transition-all duration-300 hover:scale-110 active:scale-95"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <TwitterIcon className="w-5 text-neutral-600 hover:text-rougeNoel" />
                            </Link>
                        </div>
                        <div className="text-sm text-neutral-600 flex items-center">
                            <span className="mr-2">🎁</span>
                            Copyright © {new Date().getFullYear()} PLR
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-white/30 text-xs text-vertNoel">
                                v{jsonPackage.version}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

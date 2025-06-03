import Link from 'next/link';

import { FacebookIcon } from './icons/facebook';
import { TwitterIcon } from './icons/twitter';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import jsonPackage from '@/package.json';

export const CustomFooter = (): JSX.Element => {
    const { connectedUser } = useCurrentUser();

    return (
        <div className="body-padding footer inset-x-0 bottom-0 h-20 text-xs md:text-base">
            <div className="flex justify-between h-full items-center">
                <div>
                    <Link
                        href={connectedUser ? '/home' : '/'}
                        className="block font-bold text-sm text-neutral-700 hover:text-rougeNoel transition-colors"
                    >
                        Accueil
                    </Link>
                    <Link
                        href="/contact"
                        className="pl-5 block font-bold text-sm text-neutral-700 hover:text-rougeNoel transition-colors"
                    >
                        Nous contacter
                    </Link>
                    <Link
                        href="/help"
                        className="pl-10 block font-bold text-sm text-neutral-700 hover:text-rougeNoel transition-colors"
                    >
                        Aide
                    </Link>
                </div>

                <div className="flex max-w-mid">
                    <div className="">
                        <Link
                            href={'https://www.facebook.com/'}
                            className="block m-2 sm:px-3 hover:cursor-pointer transition-colors"
                            target="_blank"
                        >
                            <FacebookIcon className="w-5 text-neutral-700 hover:text-rougeNoel" />
                        </Link>

                        <Link
                            href={'https://www.twitter.com/'}
                            className="block m-2 sm:px-3 hover:cursor-pointer transition-colors"
                            target="_blank"
                        >
                            <TwitterIcon className="w-5 text-neutral-700 hover:text-rougeNoel" />
                        </Link>
                    </div>

                    <span className="text-end self-center tooltip-container text-neutral-600">
                        Copyright © {new Date().getFullYear()} PLR. All rights reserved.
                        <span className="tooltip">v{jsonPackage.version}</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

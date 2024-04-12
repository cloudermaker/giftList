import Link from 'next/link';

import { FacebookIcon } from './icons/facebook';
import { TwitterIcon } from './icons/twitter';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

export const CustomFooter = (): JSX.Element => {
    const { connectedUser } = useCurrentUser();

    return (
        <div className="body-padding footer inset-x-0 bottom-0 h-20 text-xs md:text-base">
            <div className="flex justify-between h-full items-center">
                <div>
                    <Link href={connectedUser ? '/home' : '/'} className="block font-bold text-sm">
                        Accueil
                    </Link>
                    <Link href="/contact" className="pl-5 block font-bold text-sm">
                        Nous contacter
                    </Link>
                    <Link href="/help" className="pl-10 block font-bold text-sm">
                        Aide
                    </Link>
                </div>

                <div className="flex max-w-mid">
                    <div className="">
                        <Link
                            href={'https://www.facebook.com/'}
                            className="block m-2 sm:px-3 hover:cursor-pointer"
                            target="_blank"
                        >
                            <FacebookIcon className="w-5" />
                        </Link>

                        <Link
                            href={'https://www.twitter.com/'}
                            className="block m-2 sm:px-3 hover:cursor-pointer"
                            target="_blank"
                        >
                            <TwitterIcon className="w-5" />
                        </Link>
                    </div>

                    <span className="text-end content-center">
                        Copyright © {new Date().getFullYear()} PLR. All rights reserved.
                    </span>
                </div>
            </div>
        </div>
    );
};

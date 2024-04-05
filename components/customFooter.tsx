import Link from 'next/link';

export const CustomFooter = (): JSX.Element => {
    return (
        <div className="body-padding footer inset-x-0 bottom-0 h-20 text-xs md:text-base">
            <div className="flex justify-between h-full items-center">
                <div>
                    <Link href="/" className="block font-bold text-sm">
                        Accueil
                    </Link>
                    <Link href="/contact" className="pl-5 block font-bold text-sm">
                        Nous contacter
                    </Link>
                    <Link href="/help" className="pl-10 block font-bold text-sm">
                        Aide
                    </Link>
                </div>

                <span className="max-w-mid text-end">Copyright © {new Date().getFullYear()} PLR. All rights reserved.</span>
            </div>
        </div>
    );
};

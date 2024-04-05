import Link from 'next/link';

export const CustomFooter = (): JSX.Element => {
    return (
        <div className="body-padding footer inset-x-0 bottom-0 h-20 text-xs md:text-base">
            <div className="flex justify-between h-full items-center">
                <div>
                    <Link href="/contact" className="block font-bold">
                        Nous contacter
                    </Link>
                    <Link href="/help" className="block font-bold">
                        Aide
                    </Link>
                </div>
                <span className="max-w-mid text-end">Copyright © {new Date().getFullYear()} PLR. All rights reserved.</span>
            </div>
        </div>
    );
};

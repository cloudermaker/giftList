import Link from 'next/link';

export const CustomFooter = (): JSX.Element => {
    return (
        <div className="body-padding footer inset-x-0 bottom-0 h-16 text-xs md:text-base">
            <div className="flex justify-between h-full items-center">
                <Link href="mailto:haha@gmail.com">Contact us</Link>

                <span>Copyright © 2022 PLR. All rights reserved.</span>
            </div>
        </div>
    );
};

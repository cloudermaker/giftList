import Link from 'next/link';

export const CustomFooter = (): JSX.Element => {
    return (
        <div className="footer inset-x-0 bottom-0 h-16">
            <div className="mx-10 flex justify-between h-full items-center">
                <Link href="mailto:haha@gmail.com">Contact us</Link>

                <span>Copyright © 2022 PLR. All rights reserved.</span>
            </div>
        </div>
    );
};

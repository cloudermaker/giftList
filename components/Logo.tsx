import Link from 'next/link';

interface LogoProps {
    size?: 'small' | 'medium' | 'large';
    showText?: boolean;
    className?: string;
}

export const Logo = ({ size = 'medium', showText = true, className = '' }: LogoProps): JSX.Element => {
    const sizeClasses = {
        small: 'h-8 w-8',
        medium: 'h-12 w-12',
        large: 'h-16 w-16'
    };

    const textSizeClasses = {
        small: 'text-lg',
        medium: 'text-xl',
        large: 'text-2xl'
    };

    return (
        <Link
            href="/"
            className={`inline-flex items-center gap-3 no-underline hover:no-underline hover:opacity-80 transition-opacity ${className}`}
        >
            {/* Icône de cadeau comme logo temporaire */}
            <div
                className={`${sizeClasses[size]} bg-gradient-to-br from-rougeNoel to-vertNoel rounded-lg flex items-center justify-center shadow-lg`}
            >
                <svg
                    className="w-2/3 h-2/3 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        fillRule="evenodd"
                        d="M5 5a3 3 0 015-2.236A3 3 0 0115 5a3 3 0 013 3v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a3 3 0 013-3zm4 2.5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm3 0a1 1 0 011-1h.01a1 1 0 110 2H13a1 1 0 01-1-1z"
                        clipRule="evenodd"
                    />
                </svg>
            </div>

            {showText && (
                <div className="flex flex-col">
                    <span className={`${textSizeClasses[size]} font-bold text-rougeNoel leading-tight`}>Ma Liste</span>
                    <span className={`${textSizeClasses[size]} font-bold text-vertNoel leading-tight -mt-1`}>de Cadeaux</span>
                </div>
            )}
        </Link>
    );
};

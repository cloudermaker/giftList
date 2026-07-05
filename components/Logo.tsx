import Link from 'next/link';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

interface LogoProps {
    size?: 'small' | 'medium' | 'large';
    showText?: boolean;
    className?: string;
}

export const Logo = ({ size = 'medium', showText = true, className = '' }: LogoProps): JSX.Element => {
    const { connectedUser } = useCurrentUser();
    const href = connectedUser ? '/home' : '/';

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
            href={href}
            className={`inline-flex items-center gap-3 no-underline hover:no-underline hover:opacity-80 transition-opacity ${className}`}
        >
            {/* Icône de cadeau comme logo temporaire */}
            <div
                className={`${sizeClasses[size]} bg-rougeNoel rounded-xl flex items-center justify-center`}
            >
                <svg className="w-3/5 h-3/5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a1 1 0 00-1 1v2a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 11v8a1 1 0 001 1h14a1 1 0 001-1v-8" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7V20M12 7C12 7 9 5 9 3.5a1.5 1.5 0 013 0M12 7C12 7 15 5 15 3.5a1.5 1.5 0 00-3 0" />
                </svg>
            </div>

            {showText && (
                <div className="flex flex-col leading-tight">
                    <span className={`${textSizeClasses[size]} font-bold text-gray-800`}>Ma Liste</span>
                    <span className={`text-sm font-normal text-gray-400 tracking-wide`}>de cadeaux</span>
                </div>
            )}
        </Link>
    );
};

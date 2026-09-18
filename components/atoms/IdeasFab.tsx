import Link from 'next/link';
import { useRouter } from 'next/router';

// Bouton flottant vers la boîte à idées (rendu par le Layout sur toutes les pages, sauf /ideas)
export const IdeasFab = (): JSX.Element | null => {
    const { pathname } = useRouter();
    if (pathname === '/ideas') return null;

    return (
        <Link
            href="/ideas"
            aria-label="Boîte à idées : proposer une idée ou voter"
            className="group fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-bleuNoel text-white text-2xl flex items-center justify-center shadow-lg hover:scale-110 hover:no-underline transition-transform"
        >
            <span className="absolute right-full mr-3 whitespace-nowrap rounded-full bg-gray-800/90 text-white text-sm font-medium px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none">
                Proposer une idée / voter
            </span>
            💡
        </Link>
    );
};

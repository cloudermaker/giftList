import Link from 'next/link';

// Bouton flottant vers la boîte à idées (affiché sur / et /home)
export const IdeasFab = (): JSX.Element => (
    <Link
        href="/ideas"
        title="Proposer une idée ou voter"
        aria-label="Boîte à idées : proposer une idée ou voter"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-bleuNoel text-white text-2xl flex items-center justify-center shadow-lg hover:scale-110 hover:no-underline transition-transform"
    >
        💡
    </Link>
);

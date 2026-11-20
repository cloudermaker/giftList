import { ReactNode } from 'react';

// Titre de page standard, avec surtitre optionnel (ex : « Liste de cadeaux » au-dessus du nom)
export const PageTitle = ({
    children,
    eyebrow,
    className = 'mb-8'
}: {
    children: ReactNode;
    eyebrow?: string;
    className?: string;
}) => (
    <div className={className}>
        {eyebrow && <p className="text-sm text-fg-faint mb-1">{eyebrow}</p>}
        <h1 className="text-2xl font-bold text-fg">{children}</h1>
    </div>
);

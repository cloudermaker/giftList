import { ExternalLink } from 'lucide-react';

// Accès direct à la boutique, sans ouvrir la fiche du cadeau
export const GiftShopLink = ({ url, name, className = '' }: { url: string; name: string; className?: string }) => (
    <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        title="Ouvrir le lien du cadeau"
        aria-label={`Ouvrir le lien de ${name}`}
        className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-vertNoel hover:bg-green-50 hover:no-underline transition-colors ${className}`}
    >
        <ExternalLink className="w-4 h-4" aria-hidden="true" />
    </a>
);

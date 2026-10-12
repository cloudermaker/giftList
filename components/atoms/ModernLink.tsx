import React from 'react';
import { toSafeUrl } from '@/lib/ui/url';
import { ExternalLink } from 'lucide-react';

interface ModernLinkProps {
    href: string | null;
    className?: string;
}

const ModernLink: React.FC<ModernLinkProps> = ({ href }) => {
    const safeHref = toSafeUrl(href);
    if (!safeHref) return null;
    return (
        <a
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-white/50 text-gray-700 rounded-lg 
                     hover:bg-white/80 transition-all duration-200 gap-2 shadow-sm hover:shadow
                     border border-gray-100 no-underline hover:no-underline hover:scale-105 
                     active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-200"
            style={{ textDecoration: 'none' }}
        >
            <span>Voir le cadeau</span>
            <ExternalLink size={16} aria-hidden="true" />
        </a>
    );
};

export default ModernLink;

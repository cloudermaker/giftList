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
            className="inline-flex items-center px-4 py-2 bg-surface/50 text-fg-soft rounded-lg 
                     hover:bg-surface/80 transition-all duration-200 gap-2 shadow-xs hover:shadow-sm
                     border border-line-soft no-underline hover:no-underline hover:scale-105 
                     active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-line"
            style={{ textDecoration: 'none' }}
        >
            <span>Voir le cadeau</span>
            <ExternalLink size={16} aria-hidden="true" />
        </a>
    );
};

export default ModernLink;

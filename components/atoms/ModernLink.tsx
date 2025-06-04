import React from 'react';

interface ModernLinkProps {
    href: string;
    className?: string;
}

const ModernLink: React.FC<ModernLinkProps> = ({ href }) => {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-white/50 text-gray-700 rounded-lg 
                     hover:bg-white/80 transition-all duration-200 gap-2 shadow-sm hover:shadow
                     border border-gray-100 no-underline hover:no-underline hover:scale-105 
                     active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-200"
            style={{ textDecoration: 'none' }}
        >
            <span>Voir le cadeau</span>
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
        </a>
    );
};

export default ModernLink;

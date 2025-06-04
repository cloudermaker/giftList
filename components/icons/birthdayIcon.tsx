import React from 'react';

interface BirthdayIconProps {
    className?: string;
}

const BirthdayIcon: React.FC<BirthdayIconProps> = ({ className = '' }) => {
    return (
        <div className={`inline-block ${className}`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 20H21V22H3V20Z" fill="#E63946" />
                <path d="M7 18V10H17V18H7Z" fill="#FFB3C1" />
                <path d="M7 10C7 10 9 8 12 8C15 8 17 10 17 10H7Z" fill="#FF8FA3" />
                <path d="M12 8V6" stroke="#E63946" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="4" r="2" fill="#FFD700" />
                <path d="M8 6C8 6 7 4 5 4C3 4 2 6 2 6" stroke="#E63946" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M16 6C16 6 17 4 19 4C21 4 22 6 22 6" stroke="#E63946" strokeWidth="1.5" strokeLinecap="round" />
                <path
                    className="animate-flame"
                    d="M12 2C12 2 13 0 14 0C15 0 16 1 16 2C16 3 15 4 14 4C13 4 12 3 12 2Z"
                    fill="#FFB347"
                />
            </svg>
        </div>
    );
};

export default BirthdayIcon;

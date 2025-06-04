/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            minHeight: {
                body: 'calc(100vh - 80px)'
            },
            colors: {
                vertNoel: '#3EB489', // Mint green
                rougeNoel: '#E63946', // Bright red
                giftGold: '#FFD700',
                giftBlue: '#219EBC',
                giftPink: '#FF69B4',
                giftPurple: '#9370DB'
            },
            boxShadow: {
                'gift': '0 4px 10px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)',
                'card': '0 10px 20px -3px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.07)',
                'hover': '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.07)',
                'glow': '0 0 15px rgba(255, 215, 0, 0.5)'
            },
            keyframes: {
                wiggle: {
                    '0%, 100%': { transform: 'rotate(-3deg)' },
                    '50%': { transform: 'rotate(3deg)' },
                },
                bounce: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' }
                },
                shimmer: {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' }
                }
            },
            animation: {
                wiggle: 'wiggle 1s ease-in-out infinite',
                bounce: 'bounce 1s ease-in-out infinite',
                shimmer: 'shimmer 3s linear infinite'
            },
            maxWidth: {
                'mid': '50%',
            },
            borderRadius: {
                'xl': '1rem',
                '2xl': '1.5rem',
            }
        }
    },
    plugins: []
};

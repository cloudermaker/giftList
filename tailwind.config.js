/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                vertNoel: '#4A7C59', // Sage green
                rougeNoel: '#C0392B', // Terracotta
                bleuNoel: '#4A6FA5', // Steel blue
                violetNoel: '#667EEA' // Soft indigo (FAQ headings)
            },
            boxShadow: {
                gift: '0 4px 10px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)',
                card: '0 10px 20px -3px rgba(0, 0, 0, 0.12), 0 4px 6px -2px rgba(0, 0, 0, 0.07)',
                hover: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.07)'
            },
            keyframes: {
                wiggle: {
                    '0%, 100%': { transform: 'rotate(-3deg)' },
                    '50%': { transform: 'rotate(3deg)' }
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
            borderRadius: {
                xl: '1rem',
                '2xl': '1.5rem'
            }
        }
    },
    plugins: []
};

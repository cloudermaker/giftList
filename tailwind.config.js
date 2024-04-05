/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            minHeight: {
                body: 'calc(100vh - 80px)'
            },
            backgroundImage: {
                noel: "url('/BG_3.png')"
            },
            colors: {
                vertNoel: '#99E265',
                rougeNoel: '#E04C4C'
            },
            maxWidth: {
                'mid': '50%',
              }
        }
    },
    plugins: []
};

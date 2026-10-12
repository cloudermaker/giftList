/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
    reactStrictMode: true,
    // Le serveur e2e local a son propre dossier : il ne corrompt pas celui du `npm run dev` lancé en parallèle
    distDir: process.env.NEXT_DIST_DIR || '.next',
    outputFileTracingRoot: path.join(__dirname),
    async redirects() {
        return [
            // stale URL from the previous host, still indexed by Google
            { source: '/login', destination: '/', permanent: true }
        ];
    }
};

module.exports = nextConfig;

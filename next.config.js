/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
    reactStrictMode: true,
    outputFileTracingRoot: path.join(__dirname),
    async redirects() {
        return [
            // stale URL from the previous host, still indexed by Google
            { source: '/login', destination: '/', permanent: true }
        ];
    }
};

module.exports = nextConfig;

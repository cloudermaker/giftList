/** @type {import('next').NextConfig} */
const nextConfig = {
    i18n: {
        locales: ["fr"],
        defaultLocale: "fr",
      },
    reactStrictMode: true,
    swcMinify: true
};

module.exports = nextConfig;

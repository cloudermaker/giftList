/** @type {import('next-sitemap').IConfig} */
module.exports = {
    siteUrl: 'https://www.malistedecadeaux.fr',
    generateRobotsTxt: false, // public/robots.txt is maintained by hand
    generateIndexSitemap: false,
    exclude: ['/home', '/backoffice', '/maintenance', '/404', '/giftList*', '/group*', '/takenGiftList*', '/join*', '/ideas']
};

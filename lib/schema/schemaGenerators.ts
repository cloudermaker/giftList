export const generatePageSchema = (
    pageType: 'WebPage' | 'ContactPage' | 'AboutPage' | 'FAQPage' = 'WebPage',
    pageTitle: string,
    pageUrl: string,
    pageDescription: string = 'Créé ta liste de cadeaux en famille ou entre amis facilement et gratuitement.',
    dateModified: string = new Date().toISOString().split('T')[0]
) => {
    return {
        __html: `{
      "@context": "https://schema.org",
      "@type": "${pageType}",
      "name": "${pageTitle}",
      "description": "${pageDescription}",
      "url": "https://www.malistedecadeaux.fr${pageUrl}",
      "dateModified": "${dateModified}",
      "isPartOf": {
        "@type": "WebSite",
        "name": "Ma liste de cadeaux",
        "url": "https://www.malistedecadeaux.fr"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Ma liste de cadeaux",
        "url": "https://www.malistedecadeaux.fr"
      }
      "applicationCategory": "UtilityApplication",
      "operatingSystem": "Web browser",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
      },
      "featureList": [
        "Création de listes de cadeaux gratuitement",
        "Création de groupes familiaux",
        "Gestion secrète des cadeaux",
        "Classement par préférence",
        "Page récapitulative pour les achats"
      ]
    }`
    };
};

export const generateFAQSchema = (questions: Array<{ question: string; answer: string }>) => {
    const faqItems = questions
        .map(({ question, answer }) => {
            return `{
      "@type": "Question",
      "name": "${question}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${answer.replace(/"/g, '\\"')}"
      }
    }`;
        })
        .join(',');

    return {
        __html: `{
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [${faqItems}]
    }`
    };
};

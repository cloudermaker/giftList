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

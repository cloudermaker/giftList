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
      "inLanguage": "fr-FR",
      "isPartOf": {
        "@type": "WebSite",
        "name": "Ma liste de cadeaux",
        "url": "https://www.malistedecadeaux.fr"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Ma liste de cadeaux",
        "url": "https://www.malistedecadeaux.fr",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.malistedecadeaux.fr/favicon.ico"
        }
      },
      "potentialAction": {
        "@type": "UseAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://www.malistedecadeaux.fr/",
          "actionPlatform": [
            "http://schema.org/DesktopWebPlatform",
            "http://schema.org/MobileWebPlatform"
          ]
        },
        "name": "Créer une liste de cadeaux"
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

export const generateHowToSchema = (
    name: string,
    description: string,
    steps: Array<{ name: string; text: string; image?: string }>
) => {
    const howToSteps = steps
        .map((step, index) => {
            const imageProperty = step.image ? `,\n        "image": "${step.image}"` : '';
            return `{
        "@type": "HowToStep",
        "position": ${index + 1},
        "name": "${step.name}",
        "text": "${step.text.replace(/"/g, '\\"')}"${imageProperty}
      }`;
        })
        .join(',');

    return {
        __html: `{
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": "${name}",
      "description": "${description}",
      "step": [${howToSteps}],
      "totalTime": "PT5M"
    }`
    };
};

// Format fixe (locale + fuseau) pour éviter les écarts d'hydratation SSR
const DAY_FMT = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'Europe/Paris' });

export const formatDay = (date: Date | string): string => DAY_FMT.format(new Date(date));

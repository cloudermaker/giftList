// Liens saisis par les membres : seuls http(s) sont ouverts (bloque « javascript: » & co) ; « amazon.fr/… » devient https://
export const toSafeUrl = (raw?: string | null): string | null => {
    const value = raw?.trim();
    if (!value) return null;
    const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;
    try {
        const url = new URL(withScheme);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch {
        return null;
    }
};

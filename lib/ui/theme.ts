export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

const prefersDark = (): boolean => window.matchMedia('(prefers-color-scheme: dark)').matches;

export const readThemePreference = (): ThemePreference => {
    try {
        const value = localStorage.getItem(THEME_STORAGE_KEY);
        return value === 'light' || value === 'dark' ? value : 'system';
    } catch {
        return 'system';
    }
};

export const resolveTheme = (pref: ThemePreference): 'light' | 'dark' =>
    pref === 'system' ? (prefersDark() ? 'dark' : 'light') : pref;

export const applyThemePreference = (pref: ThemePreference): void => {
    try {
        if (pref === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
        else localStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch {
        // stockage bloqué : le choix vaut pour la page en cours
    }
    document.documentElement.dataset.theme = resolveTheme(pref);
};

export const currentTheme = (): 'light' | 'dark' =>
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

// Posé dans <head> avant le rendu : évite le flash clair au chargement
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}})()`;

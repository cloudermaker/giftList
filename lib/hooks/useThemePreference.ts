import { useEffect, useState } from 'react';
import { applyThemePreference, readThemePreference, ThemePreference } from '@/lib/ui/theme';

const NEXT: Record<ThemePreference, ThemePreference> = { system: 'light', light: 'dark', dark: 'system' };

export const THEME_LABEL: Record<ThemePreference, string> = {
    system: 'Thème : automatique',
    light: 'Thème : clair',
    dark: 'Thème : sombre'
};

export const THEME_EMOJI: Record<ThemePreference, string> = { system: '🖥️', light: '☀️', dark: '🌙' };

export const useThemePreference = () => {
    const [pref, setPref] = useState<ThemePreference>('system');

    useEffect(() => {
        setPref(readThemePreference());
    }, []);

    // En mode automatique, suit le changement du réglage système
    useEffect(() => {
        if (pref !== 'system') return;
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = () => applyThemePreference('system');
        media.addEventListener('change', onChange);
        return () => media.removeEventListener('change', onChange);
    }, [pref]);

    const cycle = () => {
        const next = NEXT[readThemePreference()];
        applyThemePreference(next);
        setPref(next);
    };

    return { pref, cycle };
};

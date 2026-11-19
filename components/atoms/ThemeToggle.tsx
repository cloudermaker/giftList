import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { applyThemePreference, readThemePreference, ThemePreference } from '@/lib/ui/theme';

const NEXT: Record<ThemePreference, ThemePreference> = { system: 'light', light: 'dark', dark: 'system' };
const LABEL: Record<ThemePreference, string> = {
    system: 'Thème : automatique',
    light: 'Thème : clair',
    dark: 'Thème : sombre'
};
const ICON = { system: Monitor, light: Sun, dark: Moon };

export const ThemeToggle = () => {
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

    const onClick = () => {
        const next = NEXT[pref];
        applyThemePreference(next);
        setPref(next);
    };

    const Icon = ICON[pref];
    return (
        <button
            type="button"
            className="icon-btn text-fg-subtle hover:text-fg transition-colors"
            onClick={onClick}
            title={LABEL[pref]}
            aria-label={LABEL[pref]}
            data-testid="theme-toggle"
            data-theme-pref={pref}
        >
            <Icon className="w-4 h-4" aria-hidden="true" />
        </button>
    );
};

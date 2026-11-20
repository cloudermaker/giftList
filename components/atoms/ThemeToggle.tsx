import { Monitor, Moon, Sun } from 'lucide-react';
import { THEME_LABEL } from '@/lib/hooks/useThemePreference';
import { ThemePreference } from '@/lib/ui/theme';

const ICON = { system: Monitor, light: Sun, dark: Moon };

export const ThemeToggle = ({
    pref,
    onCycle,
    className = ''
}: {
    pref: ThemePreference;
    onCycle: () => void;
    className?: string;
}) => {
    const Icon = ICON[pref];

    return (
        <button
            type="button"
            className={`icon-btn text-fg-subtle hover:text-fg transition-colors ${className}`}
            onClick={onCycle}
            title={THEME_LABEL[pref]}
            aria-label={THEME_LABEL[pref]}
            data-testid="theme-toggle"
            data-theme-pref={pref}
        >
            <Icon className="w-4 h-4" aria-hidden="true" />
        </button>
    );
};

export const CustomInput = ({
    id,
    value,
    className,
    onChange,
    onKeyDown,
    type,
    disabled,
    autoFocus,
    placeholder
}: {
    id?: string;
    value: string;
    className?: string;
    onChange: (input: string) => void;
    onKeyDown?: (keyCode: string) => void;
    type?: string;
    disabled?: boolean;
    autoFocus?: boolean;
    placeholder?: string;
}): JSX.Element => {
    const baseStyle =
        'px-3 py-1.5 bg-white/50 border border-neutral-200 rounded-lg focus:outline-none focus:border-vertNoel focus:ring-1 focus:ring-vertNoel transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    if (onKeyDown) {
        return (
            <input
                id={id}
                value={value}
                className={`${baseStyle} ${className}`}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => onKeyDown(e.code)}
                type={type ?? 'text'}
                disabled={disabled}
                autoFocus={autoFocus}
                placeholder={placeholder}
            />
        );
    }

    return (
        <input
            id={id}
            value={value}
            className={`${baseStyle} ${className}`}
            onChange={(e) => onChange(e.target.value)}
            type={type ?? 'text'}
            disabled={disabled}
            autoFocus={autoFocus}
            placeholder={placeholder}
        />
    );
};

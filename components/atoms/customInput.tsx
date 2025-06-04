export const CustomInput = ({
    id,
    value,
    className,
    onChange,
    onKeyDown,
    type
}: {
    id?: string;
    value: string;
    className?: string;
    onChange: (input: string) => void;
    onKeyDown?: (keyCode: string) => void;
    type?: string;
}): JSX.Element => {
    const baseStyle =
        'px-3 py-1.5 bg-white/50 border border-neutral-200 rounded-lg focus:outline-none focus:border-vertNoel focus:ring-1 focus:ring-vertNoel transition-all duration-200';

    if (onKeyDown) {
        return (
            <input
                id={id}
                value={value}
                className={`${baseStyle} ${className}`}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => onKeyDown(e.code)}
                type={type ?? 'text'}
            />
        );
    }

    return <input id={id} value={value} className={`${baseStyle} ${className}`} onChange={(e) => onChange(e.target.value)} />;
};

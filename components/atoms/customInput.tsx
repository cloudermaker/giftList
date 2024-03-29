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
    if (onKeyDown) {
        return (
            <input
                id={id}
                value={value}
                className={className}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => onKeyDown(e.code)}
                type={type ?? 'text'}
            />
        );
    }

    return <input id={id} value={value} className={className} onChange={(e) => onChange(e.target.value)} />;
};

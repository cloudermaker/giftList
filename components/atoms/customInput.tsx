export const CustomInput = (
    { id, value, className, onChange, onKeyDown }:
    { id?: string; value: string; className?: string; onChange: (input: string) => void; onKeyDown?: (keyCode: string) => void }): JSX.Element => 
{
    if (onKeyDown) {
        return <input id={id} value={value} className={className} 
            onChange={(e) => onChange(e.target.value)} 
            onKeyDown={(e) => onKeyDown(e.code)} />;
    }

    return <input id={id} value={value} className={className} onChange={(e) => onChange(e.target.value)} />;    
}
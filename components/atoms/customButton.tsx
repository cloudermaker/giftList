import { ReactNode, useState } from 'react';
import { CircleLoader } from 'react-spinners';

const VARIANT_CLASS = {
    red: 'btn',
    green: 'btn green-button',
    slate: 'btn slate-button',
    icon: 'icon-btn'
} as const;

const CustomButton = ({
    onClick,
    children,
    disabled,
    className,
    variant = 'red',
    type
}: {
    onClick: () => void;
    children: ReactNode;
    disabled?: boolean;
    className?: string;
    variant?: keyof typeof VARIANT_CLASS;
    type?: 'button' | 'submit' | 'reset' | undefined;
}): JSX.Element => {
    const [isInProgress, setIsInProgress] = useState<boolean>(false);

    const customOnClick = async (): Promise<void> => {
        setIsInProgress(true);

        await onClick();

        window.setTimeout(function () {
            setIsInProgress(false);
        }, 200);
    };

    return (
        <button
            onClick={customOnClick}
            className={[VARIANT_CLASS[variant], className].filter(Boolean).join(' ')}
            disabled={disabled ?? false}
            type={type}
        >
            <span className="flex items-center justify-center">
                {isInProgress && <CircleLoader size="20px" color="white" />}
                {!isInProgress && children}
            </span>
        </button>
    );
};

export default CustomButton;

import { ReactNode, useState } from 'react';
import { CircleLoader } from 'react-spinners';

const CustomButton = ({
    onClick,
    children,
    disabled,
    className,
    type
}: {
    onClick: () => void;
    children: ReactNode;
    disabled?: boolean;
    className?: string;
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
        <button onClick={customOnClick} className={className} disabled={disabled ?? false} type={type}>
            {isInProgress && <CircleLoader size="20px" color="green" />}
            {!isInProgress && children}
        </button>
    );
};

export default CustomButton;

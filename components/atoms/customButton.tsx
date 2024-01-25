import { ReactNode, useState } from 'react';
import { CircleLoader } from 'react-spinners';

const CustomButton = ({
    onClick,
    children,
    disabled,
    className
}: {
    onClick: () => void;
    children: ReactNode;
    disabled?: boolean;
    className?: string;
}): JSX.Element => {
    const [isInProgress, setIsInProgress] = useState<boolean>(false);

    const customOnClick = async (): Promise<void> => {
        setIsInProgress(true);

        await onClick();

        setIsInProgress(false);
    };

    return (
        <button onClick={customOnClick} className={className ?? ''} disabled={disabled ?? false}>
            <div className="flex">
                {isInProgress && <CircleLoader size="20px" color="green" />}
                {!isInProgress && children}
            </div>
        </button>
    );
};

export default CustomButton;

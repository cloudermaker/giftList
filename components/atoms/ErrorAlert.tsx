interface ErrorAlertProps {
    message: string;
    onClose?: () => void;
}

export const ErrorAlert = ({ message, onClose }: ErrorAlertProps): JSX.Element => {
    return (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span className="font-medium">{message}</span>
            </div>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer"
                    style={{ all: 'unset', cursor: 'pointer', fontSize: '1.25rem', fontWeight: 'bold', lineHeight: 1 }}
                >
                    ×
                </button>
            )}
        </div>
    );
};

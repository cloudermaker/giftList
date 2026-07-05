import { ReactNode, useEffect } from 'react';

interface ModalProps {
    title: string;
    emoji?: string;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
}

export const Modal = ({ title, emoji, onClose, children, footer }: ModalProps): JSX.Element => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
                className="absolute inset-0 bg-black/50"
                style={{ backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />
            <div className="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Drag handle on mobile */}
                <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-gray-300" />
                </div>

                <div className="p-6 sm:p-8 pb-4 overflow-y-auto">
                    <div className="flex justify-between items-start mb-5">
                        {emoji ? <span className="text-4xl">{emoji}</span> : <span />}
                        <button className="icon-btn text-gray-400 hover:text-gray-600" onClick={onClose}>✕</button>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-5">{title}</h2>
                    {children}
                </div>
                {footer && (
                    <div className="px-6 sm:px-8 py-5 border-t border-gray-100 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

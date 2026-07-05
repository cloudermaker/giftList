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
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-8 pb-4">
                    <div className="flex justify-between items-start mb-5">
                        {emoji ? <span className="text-4xl">{emoji}</span> : <span />}
                        <button className="icon-btn text-gray-400 hover:text-gray-600" onClick={onClose}>✕</button>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-5">{title}</h2>
                    {children}
                </div>
                {footer && (
                    <div className="px-8 py-6 border-t border-gray-100 mt-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

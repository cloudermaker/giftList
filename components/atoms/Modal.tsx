import { ReactNode, useEffect } from 'react';

interface ModalProps {
    title: string;
    emoji?: string;
    onClose: () => void;
    children: ReactNode;
    footer?: ReactNode;
}

export const Modal = ({ title, emoji, onClose, children, footer }: ModalProps) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/50" style={{ backdropFilter: 'blur(4px)' }} onClick={onClose} />
            <div className="relative bg-surface w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Drag handle on mobile */}
                <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-surface-stronger" />
                </div>

                <div className="p-6 sm:p-8 pb-4 overflow-y-auto">
                    <div className="flex justify-between items-start mb-5">
                        {emoji ? <span className="text-4xl">{emoji}</span> : <span />}
                        <button className="icon-btn text-fg-subtle hover:text-fg-muted" onClick={onClose}>
                            ✕
                        </button>
                    </div>
                    <h2 className="text-2xl font-bold text-fg mb-5">{title}</h2>
                    {children}
                </div>
                {footer && <div className="px-6 sm:px-8 py-5 border-t border-line-soft shrink-0">{footer}</div>}
            </div>
        </div>
    );
};

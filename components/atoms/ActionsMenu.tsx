import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type TMenuAction = { label: string; icon: string; onClick: () => void; danger?: boolean };

type TActionsMenuProps = { label: string; actions: TMenuAction[] };

const ITEM_HEIGHT = 40;

/** Bouton « ⋯ » ouvrant un menu d'actions, rendu dans le body pour ne jamais être coupé par la carte. */
const ActionsMenu = ({ label, actions }: TActionsMenuProps) => {
    const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const place = () => {
        const rect = buttonRef.current!.getBoundingClientRect();
        const height = actions.length * ITEM_HEIGHT + 8;
        // Ouvre vers le haut s'il n'y a pas la place en dessous
        const top = rect.bottom + 4 + height > window.innerHeight ? rect.top - 4 - height : rect.bottom + 4;
        setPos({ top, right: window.innerWidth - rect.right });
    };

    const toggle = () => (pos ? setPos(null) : place());

    useEffect(() => {
        if (!pos) return;
        const close = () => setPos(null);
        const onDown = (e: PointerEvent) => {
            const target = e.target as Node;
            if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
        };
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
        document.addEventListener('pointerdown', onDown);
        document.addEventListener('keydown', onKey);
        // Suit le bouton au défilement
        window.addEventListener('scroll', place, true);
        window.addEventListener('resize', place);
        return () => {
            document.removeEventListener('pointerdown', onDown);
            document.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', place, true);
            window.removeEventListener('resize', place);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [!!pos]);

    return (
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
                ref={buttonRef}
                type="button"
                aria-label={label}
                aria-haspopup="menu"
                aria-expanded={!!pos}
                onClick={toggle}
                className="w-9 h-9 rounded-lg text-xl leading-none text-neutral-600 hover:bg-neutral-100"
            >
                ⋯
            </button>
            {pos &&
                createPortal(
                    <div
                        ref={menuRef}
                        role="menu"
                        style={{ top: pos.top, right: pos.right }}
                        className="fixed z-50 min-w-44 py-1 bg-white rounded-lg shadow-lg border border-neutral-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {actions.map((action) => (
                            <button
                                key={action.label}
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    setPos(null);
                                    action.onClick();
                                }}
                                className={`flex items-center gap-2 w-full h-10 text-left px-4 text-sm hover:bg-neutral-50 ${action.danger ? 'text-red-600' : ''}`}
                            >
                                <span aria-hidden>{action.icon}</span>
                                {action.label}
                            </button>
                        ))}
                    </div>,
                    document.body
                )}
        </div>
    );
};

export default ActionsMenu;

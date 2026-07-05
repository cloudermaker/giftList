import Router from 'next/router';
import { useRef, useEffect } from 'react';

export enum EHeader {
    Homepage = 'Homepage',
    Group = 'My group',
    GiftList = 'My gift list',
    TakenGiftList = 'My taken gift list',
    Backoffice = 'Backoffice'
}

export const CustomHeader = ({
    selectedHeader = EHeader.Homepage,
    groupId,
    userId,
    customTitle
}: {
    selectedHeader?: EHeader;
    groupId: string;
    userId: string;
    customTitle?: string;
}): JSX.Element => {
    const navRef = useRef<HTMLElement>(null);
    const pillRef = useRef<HTMLDivElement>(null);
    const initialized = useRef(false);

    const menus = [
        { url: '/home', name: 'Accueil', isSelected: selectedHeader === EHeader.Homepage, icon: '🏠' },
        { url: `/group/${groupId}`, name: 'Mon groupe', isSelected: selectedHeader === EHeader.Group, icon: '👪' },
        { url: `/giftList/${userId}`, name: customTitle || 'Ma liste', isSelected: selectedHeader === EHeader.GiftList, icon: '🎁' },
        { url: `/takenGiftList/${userId}`, name: 'À acheter', isSelected: selectedHeader === EHeader.TakenGiftList, icon: '🛍️' },
    ];

    useEffect(() => {
        const nav = navRef.current;
        const pill = pillRef.current;
        if (!nav || !pill) return;

        const place = (animate: boolean) => {
            const active = nav.querySelector('[data-active="true"]') as HTMLElement | null;
            if (!active) return;
            const { left: navLeft } = nav.getBoundingClientRect();
            const { left, width } = active.getBoundingClientRect();
            if (!animate) {
                pill.style.transition = 'none';
                pill.style.left = `${left - navLeft}px`;
                pill.style.width = `${width}px`;
                pill.offsetWidth; // force reflow
                pill.style.transition = '';
            } else {
                pill.style.left = `${left - navLeft}px`;
                pill.style.width = `${width}px`;
            }
        };

        place(!initialized.current ? false : true);
        if (!initialized.current) initialized.current = true;

        const onResize = () => place(false);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [selectedHeader]);

    const onMenuClick = (menu: any) => {
        if (menu.onClick) {
            menu.onClick();
        } else if (menu.url === Router.asPath) {
            window.location.reload();
        } else {
            Router.push(menu.url);
        }
    };

    return (
        <nav
            ref={navRef}
            className="flex justify-evenly w-full items-center p-1.5 mb-6 rounded-full relative"
            style={{ background: 'rgba(58,46,37,0.08)' }}
        >
            <div
                ref={pillRef}
                className="absolute top-1 bottom-1 rounded-full bg-white pointer-events-none"
                style={{
                    boxShadow: '0 1px 6px rgba(0,0,0,0.1)',
                    transition: 'left 0.28s cubic-bezier(.4,0,.2,1), width 0.28s cubic-bezier(.4,0,.2,1)',
                }}
            />
            {menus.map((menu) => (
                <div
                    key={`menu_${menu.name}`}
                    data-active={menu.isSelected ? 'true' : undefined}
                    onClick={() => onMenuClick(menu)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full text-base text-gray-700 cursor-pointer select-none whitespace-nowrap relative z-10 transition-all duration-200 ${
                        menu.isSelected
                            ? 'font-bold'
                            : 'hover:ring-1 hover:ring-inset hover:ring-black/10'
                    }`}
                >
                    <span className="text-lg">{menu.icon}</span>
                    <span className="hidden sm:inline">{menu.name}</span>
                </div>
            ))}
        </nav>
    );
};

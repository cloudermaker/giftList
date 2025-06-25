import Router from 'next/router';
import { useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAlignJustify } from '@fortawesome/free-solid-svg-icons';
import { useClickOutside } from './atoms/clickOutsideHook';

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
    onDisconnectClick
}: {
    selectedHeader?: EHeader;
    groupId: string;
    userId: string;
    onDisconnectClick: () => void;
}): JSX.Element => {
    const [isResponsiveMenuOpen, setIsResponsiveMenuOpen] = useState<boolean>(false);
    const ref = useClickOutside(() => setIsResponsiveMenuOpen(false));

    const commonStyle = 'text-neutral-500 hover:text-rougeNoel hover:cursor-pointer transition-all duration-300';
    const menus = [
        { url: `/group/${groupId}`, name: 'Mon groupe', isSelected: selectedHeader === EHeader.Group, icon: '👪' },
        { url: `/giftList/${userId}`, name: 'Ma liste de cadeaux', isSelected: selectedHeader === EHeader.GiftList, icon: '🎁' },
        { url: `/takenGiftList/${userId}`, name: 'A acheter', isSelected: selectedHeader === EHeader.TakenGiftList, icon: '🛍️' },
        { url: '', name: 'Déconnexion', isSelected: false, icon: '🚪', onClick: onDisconnectClick }
    ];

    const onMenuClick = (menu: any) => {
        if (menu.onClick) {
            menu.onClick();
        } else if (menu.url === Router.asPath) {
            // Force reload of page since router.push do not full reload page
            window.location.reload();
        } else {
            Router.push(menu.url);
        }
    };

    return (
        <>
            <div className="header flex justify-between py-2 px-5 mb-4 sm:px-3 bg-gradient-to-r from-vertNoel/10 to-rougeNoel/10">
                <div
                    onClick={() => Router.push('/home')}
                    className={`${commonStyle} gap-2 flex items-center ${
                        selectedHeader === EHeader.Homepage
                            ? 'font-bold text-rougeNoel candy-cane-border px-3 py-1 rounded-lg bg-white/50'
                            : 'hover:bg-white/30 px-3 py-1 rounded-lg transition-all duration-300'
                    }`}
                >
                    <span className={`text-xl ${selectedHeader === EHeader.Homepage ? 'gift-icon' : ''}`}>🏠</span>
                    <span>Accueil</span>
                </div>

                {menus.map((menu) => (
                    <div
                        key={`menu_${menu.name}`}
                        onClick={() => onMenuClick(menu)}
                        className={`${commonStyle} hidden sm:flex items-center ${
                            menu.isSelected
                                ? 'font-bold text-rougeNoel candy-cane-border px-3 py-1 rounded-lg bg-white/50'
                                : 'hover:bg-white/30 px-3 py-1 rounded-lg transition-all duration-300'
                        }`}
                    >
                        <span className={`mr-1 ${menu.isSelected ? 'gift-icon' : ''}`}>{menu.icon}</span>
                        {menu.name}
                    </div>
                ))}

                <div
                    className={`sm:hidden ${commonStyle}`}
                    onClick={(e) => {
                        setIsResponsiveMenuOpen((value) => !value);
                    }}
                >
                    <span className="inline-flex items-center gap-2">
                        <span
                            className={`inline-flex text-xl transition-transform duration-300 ${isResponsiveMenuOpen ? 'rotate-180' : ''}`}
                        >
                            🔻
                        </span>
                        <b>Menu</b>
                        <FontAwesomeIcon icon={faAlignJustify} className="w-5 h-5 text-rougeNoel" />
                    </span>
                </div>
            </div>

            <div
                className="absolute right-0 z-10 -mt-2 mr-4 p-2 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                role="menu"
                id="dropdown-menu-responsive"
                aria-orientation="vertical"
                aria-labelledby="menu-button"
                hidden={!isResponsiveMenuOpen}
                ref={ref}
            >
                {menus.map((menu) => (
                    <span
                        key={`menu_${menu.name}`}
                        onClick={() => onMenuClick(menu)}
                        className={`${commonStyle} flex items-center px-4 py-2 text-base ${
                            menu.isSelected
                                ? 'font-bold text-rougeNoel bg-white rounded-lg candy-cane-border'
                                : 'hover:bg-white/50'
                        }`}
                        role="menuitem"
                    >
                        <span className={`mr-2 ${menu.isSelected ? 'gift-icon' : ''}`}>{menu.icon}</span>
                        {menu.name}
                    </span>
                ))}
            </div>
        </>
    );
};

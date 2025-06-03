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
        { url: `/takenGiftList/${userId}`, name: 'A acheter', isSelected: selectedHeader === EHeader.TakenGiftList, icon: '🛍️' }
    ];

    const navigate = (url: string) => {
        setIsResponsiveMenuOpen(false);
        Router.push(url);
    };

    return (
        <div className="header flex justify-between p-2 px-5 sm:px-3 bg-gradient-to-r from-vertNoel/10 to-rougeNoel/10 backdrop-blur-sm">
            <div
                onClick={() => Router.push('/home')}
                className={`${commonStyle} flex items-center ${
                    selectedHeader === EHeader.Homepage
                        ? 'font-bold text-rougeNoel candy-cane-border px-3 py-1 rounded-lg bg-white/50'
                        : 'hover:bg-white/30 px-3 py-1 rounded-lg transition-all duration-300'
                }`}
            >
                <span className={`mr-1 ${selectedHeader === EHeader.Homepage ? 'gift-icon' : ''}`}>🏠</span>
                <span>Accueil</span>
            </div>

            {menus.map((menu) => (
                <div
                    key={`menu_${menu.name}`}
                    onClick={() => {
                        // Cannot use router / link => force server side rerender (same page)
                        Router.push(menu.url);
                    }}
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

            <div className="flex">
                <div className="relative inline-block text-left self-center">
                    <div className={`sm:hidden ${commonStyle}`} onClick={() => setIsResponsiveMenuOpen((value) => !value)}>
                        <FontAwesomeIcon icon={faAlignJustify} className="w-5" />
                    </div>

                    <div
                        className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white/95 backdrop-blur-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                        role="menu"
                        id="dropdown-menu-responsive"
                        aria-orientation="vertical"
                        aria-labelledby="menu-button"
                        hidden={!isResponsiveMenuOpen}
                        ref={ref}
                    >
                        <div className="py-1" role="none">
                            {menus.map((menu) => (
                                <span
                                    key={`menu_${menu.name}`}
                                    onClick={() => navigate(menu.url)}
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
                            <hr className="my-1 border-neutral-200" />
                            <span
                                className={`${commonStyle} flex items-center px-4 py-2 text-base hover:bg-white/50`}
                                onClick={onDisconnectClick}
                                role="menuitem"
                            >
                                <span className="mr-2">🚪</span>
                                Déconnexion
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    className={`${commonStyle} hidden sm:flex items-center px-3 py-1 hover:bg-white/30 rounded-lg transition-all duration-300`}
                    onClick={onDisconnectClick}
                >
                    <span className="mr-1">🚪</span>
                    <span>Déconnexion</span>
                </div>
            </div>
        </div>
    );
};

import Link from 'next/link';
import Router from 'next/router';
import { useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket, faHomeUser, faAlignJustify } from '@fortawesome/free-solid-svg-icons';
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

    const commonStyle = 'text-neutral-500 hover:text-vertNoel hover:cursor-pointer';
    const menus = [
        { url: `/group/${groupId}`, name: 'Mon groupe', isSelected: selectedHeader === EHeader.Group },
        { url: `/giftList/${userId}`, name: 'Ma liste de cadeaux', isSelected: selectedHeader === EHeader.GiftList },
        { url: `/takenGiftList/${userId}`, name: 'A acheter', isSelected: selectedHeader === EHeader.TakenGiftList }
    ];

    const navigate = (url: string) => {
        setIsResponsiveMenuOpen(false);
        Router.push(url);
    };

    return (
        <div className="header flex justify-between p-2 px-5 sm:px-3">
            <div onClick={() => Router.push('/home')} className={commonStyle}>
                <FontAwesomeIcon icon={faHomeUser} />
            </div>

            {menus.map((menu) => (
                <div
                    key={`menu_${menu.name}`}
                    onClick={() => {
                        // Cannot use router / link => force server side rerender (same page)
                        window.location.href = menu.url;
                    }}
                    className={`${commonStyle} hidden sm:block ${menu.isSelected ? 'font-bold text-vertNoel' : ''}`}
                >
                    {menu.name}
                </div>
            ))}

            <div className="flex">
                <div className="relative inline-block text-left">
                    <div className={`sm:hidden ${commonStyle}`} onClick={() => setIsResponsiveMenuOpen((value) => !value)}>
                        <FontAwesomeIcon icon={faAlignJustify} />
                    </div>

                    <div
                        className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                        role="menu"
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
                                    className={`${commonStyle} block px-4 py-2 text-base ${
                                        menu.isSelected ? 'font-bold text-vertNoel' : ''
                                    }`}
                                    role="menuitem"
                                >
                                    {menu.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <hr className="sm:hidden px-3 self-center border-1 border-vertNoel rotate-90" />

                <div className={commonStyle} onClick={onDisconnectClick}>
                    <FontAwesomeIcon icon={faRightFromBracket} />
                </div>
            </div>
        </div>
    );
};

import Router from 'next/router';

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
    const menus = [
        { url: '/home', name: 'Accueil', isSelected: selectedHeader === EHeader.Homepage, icon: '🏠' },
        { url: `/group/${groupId}`, name: 'Mon groupe', isSelected: selectedHeader === EHeader.Group, icon: '👪' },
        { url: `/giftList/${userId}`, name: customTitle || 'Ma liste', isSelected: selectedHeader === EHeader.GiftList, icon: '🎁' },
        { url: `/takenGiftList/${userId}`, name: 'À acheter', isSelected: selectedHeader === EHeader.TakenGiftList, icon: '🛍️' },
    ];

    const onMenuClick = (menu: any) => {
        if (menu.onClick) {
            menu.onClick();
        } else if (menu.url === Router.asPath) {
            window.location.reload();
        } else {
            Router.push(menu.url);
        }
    };

    const itemBase = 'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 cursor-pointer select-none whitespace-nowrap';
    const itemActive = 'text-gray-900 bg-white shadow-sm';
    const itemInactive = 'text-gray-500 hover:text-gray-700 hover:bg-black/5';

    return (
        <nav className="flex w-full items-center gap-1 bg-rougeNoel/8 border border-rougeNoel/20 rounded-xl px-2 py-2 mb-6 overflow-x-auto">
            {menus.map((menu) => (
                <div
                    key={`menu_${menu.name}`}
                    onClick={() => onMenuClick(menu)}
                    className={`${itemBase} ${menu.isSelected ? itemActive : itemInactive}`}
                >
                    <span className="text-lg">{menu.icon}</span>
                    <span className="hidden sm:inline">{menu.name}</span>
                </div>
            ))}
        </nav>
    );
};

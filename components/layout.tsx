import { ReactNode } from 'react';
import { CustomFooter } from './atoms/CustomFooter';
import { CustomHeader, EHeader } from './customHeader';
import { Logo } from './Logo';
import Router from 'next/router';
import { useLogout } from '@/lib/hooks/useLogout';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

export const Layout = ({
    children,
    selectedHeader = EHeader.Homepage,
    withHeader = true,
    pageTitle
}: {
    children: ReactNode;
    selectedHeader?: EHeader;
    withHeader?: boolean;
    pageTitle?: string;
}): JSX.Element => {
    const { logout } = useLogout();
    const { connectedUser } = useCurrentUser();

    const onDisconnectClick = async (): Promise<void> => {
        await logout();
        Router.push('/');
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Logo et statut utilisateur en haut */}
            <div className="border-b border-black/[.06]" style={{ background: '#f2ebe0' }}>
                <div className="body-padding py-3 sm:py-5 grid grid-cols-3 items-center">
                    <Logo size="medium" showText={true} />

                    {connectedUser && (
                        <div className="flex flex-col items-center">
                            <p className="text-xs font-medium tracking-widest uppercase text-gray-400 leading-none mb-1">Groupe</p>
                            <p className="text-base text-center font-bold text-gray-800 leading-none">{connectedUser.groupName}</p>
                        </div>
                    )}

                    {connectedUser && (
                        <div className="relative group flex justify-end">
                            <div className="flex items-center gap-2 text-sm cursor-default flex-nowrap">
                                <span className="hidden sm:inline-block w-2 h-2 bg-green-500 rounded-full" />
                                {connectedUser.isAdmin && (
                                    <span className="hidden sm:inline-flex text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full select-none items-center gap-1">
                                        🛡️ Admin
                                    </span>
                                )}
                                <button
                                    className="icon-btn text-gray-400 hover:text-rougeNoel transition-colors"
                                    onClick={onDisconnectClick}
                                    title="Se déconnecter"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                                        <line x1="12" y1="2" x2="12" y2="12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="absolute right-0 top-full mt-1 w-48 p-2 bg-white border border-gray-200 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                <p className="text-xs"><span className="font-semibold">Nom :</span> {connectedUser.userName}</p>
                                <p className="text-xs"><span className="font-semibold">Groupe :</span> {connectedUser.groupName}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="body-padding flex-grow pb-16 mt-4">
                {withHeader && connectedUser && (
                    <CustomHeader
                        selectedHeader={selectedHeader}
                        groupId={connectedUser.groupId}
                        userId={connectedUser.userId}
                        customTitle={pageTitle}
                    />
                )}

                <div className="max-w-4xl mx-auto px-4">
                    {children}
                </div>
            </div>

            <CustomFooter />
        </div>
    );
};

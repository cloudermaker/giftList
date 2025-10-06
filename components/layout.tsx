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
    withHeader = true
}: {
    children: ReactNode;
    selectedHeader?: EHeader;
    withHeader?: boolean;
}): JSX.Element => {
    const { logout } = useLogout();
    const { connectedUser } = useCurrentUser();

    const onDisconnectClick = (): void => {
        logout();

        Router.push('/');
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Logo et statut utilisateur en haut */}
            <div className="bg-white shadow-sm border-b border-gray-100">
                <div className="body-padding py-4 flex justify-between items-center">
                    <Logo size="medium" showText={true} />

                    {connectedUser && (
                        <div className="relative group">
                            {/* Indicator */}
                            <div className="flex items-center text-sm cursor-default">
                                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1" />
                                <span>Connecté</span>
                            </div>
                            {/* Tooltip with details on hover */}
                            <div className="absolute right-0 top-full mt-1 w-48 p-2 bg-white border border-gray-200 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                <p className="text-xs">
                                    <span className="font-semibold">Nom :</span> {connectedUser.userName}
                                </p>
                                <p className="text-xs">
                                    <span className="font-semibold">Groupe :</span> {connectedUser.groupName}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="body-padding flex-grow">
                {withHeader && connectedUser && (
                    <CustomHeader
                        selectedHeader={selectedHeader}
                        groupId={connectedUser.groupId}
                        userId={connectedUser.userId}
                        onDisconnectClick={onDisconnectClick}
                    />
                )}

                {children}
            </div>

            <CustomFooter />
        </div>
    );
};

import { ReactNode } from 'react';
import { CustomFooter } from './customFooter';
import { CustomHeader, EHeader } from './customHeader';
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
        <div className="min-h-screen">
            <div className="body-padding min-h-body">
                {connectedUser && (
                    <div className="pt-5 pb-3 flex justify-between">
                        <div className="text-xs flex bg-shadow">
                            <>
                                <span>Connecté en tant que</span>
                                <b className="pl-1 text-rougeNoel">{connectedUser.userName}</b>
                                <span>, dans le groupe</span>
                                <b className="pl-1 text-vertNoel">{connectedUser.groupName}</b>
                            </>
                        </div>
                    </div>
                )}

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

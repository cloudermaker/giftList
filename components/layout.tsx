import { ReactNode } from 'react';
import { CustomFooter } from './customFooter';
import { CustomHeader, EHeader } from './customHeader';
import Router from 'next/router';
import CountDown from './countDown';
import { useLogout } from '@/lib/hooks/useLogout';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Toaster } from './atoms/toaster';

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
        <div className="bg-noel bg-cover">
            <Toaster />

            <div className="body-padding min-h-body">
                <div className="pt-5 pb-3 flex justify-between">
                    <div className="text-xs md:flex bg-shadow">
                        {connectedUser && (
                            <>
                                <span className="hidden md:block">Connecté en tant que</span>
                                <b className="pl-1 text-vertNoel">{connectedUser.userName}</b>
                                <span className="hidden md:block">, dans le groupe</span>
                                <br />
                                <b className="pl-1 text-vertNoel">{connectedUser.groupName}</b>
                            </>
                        )}
                    </div>

                    <span className="text-xs self-center">
                        <CountDown />
                    </span>
                </div>

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

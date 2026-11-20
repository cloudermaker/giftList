import { ReactNode } from 'react';
import { CustomFooter } from './atoms/CustomFooter';
import { IdeasFab } from './atoms/IdeasFab';
import { CustomHeader, EHeader } from './customHeader';
import { Logo } from './Logo';
import { ThemeToggle } from './atoms/ThemeToggle';
import ActionsMenu from './atoms/ActionsMenu';
import { THEME_EMOJI, THEME_LABEL, useThemePreference } from '@/lib/hooks/useThemePreference';
import Router from 'next/router';
import Link from 'next/link';
import { Power } from 'lucide-react';
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
}) => {
    const { logout } = useLogout();
    const { connectedUser } = useCurrentUser();
    const { pref: themePref, cycle: cycleTheme } = useThemePreference();

    const onDisconnectClick = async (): Promise<void> => {
        await logout();
        Router.push('/');
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Logo et statut utilisateur en haut */}
            <div className="border-b border-black/6 bg-band">
                {/* Mobile : le nom du groupe prend tout l'espace entre le logo et les icônes ; desktop : 3 colonnes égales (nom centré) */}
                <div className="body-padding py-3 sm:py-5 grid grid-cols-[auto_1fr_auto] sm:grid-cols-3 gap-3 items-center">
                    <Logo size="medium" showText={true} />

                    {connectedUser ? (
                        <div className="flex flex-col items-center min-w-0">
                            <p className="text-xs font-medium tracking-widest uppercase text-fg-subtle leading-none mb-1">
                                Groupe
                            </p>
                            <p
                                className="text-base text-center font-bold text-fg leading-tight line-clamp-2 wrap-break-word max-w-full"
                                title={connectedUser.groupName}
                            >
                                {connectedUser.groupName}
                            </p>
                        </div>
                    ) : (
                        <div />
                    )}

                    <div className="flex justify-end">
                        <div className="flex items-center gap-2 text-sm cursor-default flex-nowrap">
                            {/* Sur mobile, connecté : un seul menu compte pour laisser la place au nom du groupe */}
                            <ThemeToggle
                                pref={themePref}
                                onCycle={cycleTheme}
                                className={connectedUser ? 'hidden sm:inline-block' : ''}
                            />
                            {connectedUser && (
                                <>
                                    {connectedUser.isAdmin && (
                                        <span className="hidden sm:inline-flex text-xs font-semibold bg-warning-tint text-warning-fg-strong border border-warning-line-strong px-2 py-0.5 rounded-full select-none items-center gap-1">
                                            🛡️ Admin
                                        </span>
                                    )}
                                    <Link
                                        href="/profil"
                                        className="hidden sm:inline-block icon-btn text-fg-subtle hover:text-vertNoel hover:no-underline transition-colors"
                                        title={`Mon profil (${connectedUser.userName})`}
                                        aria-label="Mon profil"
                                    >
                                        👤
                                    </Link>
                                    <button
                                        className="hidden sm:inline-block icon-btn text-fg-subtle hover:text-rougeNoel transition-colors"
                                        onClick={onDisconnectClick}
                                        title="Se déconnecter"
                                    >
                                        <Power className="w-4 h-4" aria-hidden="true" />
                                    </button>
                                    <div className="sm:hidden">
                                        <ActionsMenu
                                            label="Mon compte"
                                            trigger="👤"
                                            triggerClassName="icon-btn"
                                            actions={[
                                                {
                                                    label: `Mon profil (${connectedUser.userName})`,
                                                    icon: '👤',
                                                    onClick: () => Router.push('/profil')
                                                },
                                                {
                                                    label: THEME_LABEL[themePref],
                                                    icon: THEME_EMOJI[themePref],
                                                    onClick: cycleTheme
                                                },
                                                {
                                                    label: 'Se déconnecter',
                                                    icon: '⏻',
                                                    onClick: onDisconnectClick,
                                                    dividerBefore: true
                                                }
                                            ]}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="body-padding grow pb-16 mt-4">
                {withHeader && connectedUser && (
                    <CustomHeader
                        selectedHeader={selectedHeader}
                        groupId={connectedUser.groupId}
                        userId={connectedUser.userId}
                        customTitle={pageTitle}
                    />
                )}

                <div className="max-w-4xl mx-auto px-4">{children}</div>
            </div>

            <IdeasFab />
            <CustomFooter />
        </div>
    );
};

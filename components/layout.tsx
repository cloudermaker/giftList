import { ReactNode, useEffect, useState } from 'react';
import { CustomFooter } from './customFooter';
import { CustomHeader, EHeader } from './customHeader';
import Cookies from 'js-cookie';
import Router from 'next/router';
import axios from 'axios';
import { TUserInfoResult, buildUserInfoUrl } from '../pages/api/groupUser';
import CountDown from './countDown';

export const GROUP_ID_COOKIE = 'giftList_groupName';
export const USER_ID_COOKIE = 'giftList_name';

export const Layout = ({
    children,
    selectedHeader = EHeader.Homepage,
    withHeader = true
}: {
    children: ReactNode;
    selectedHeader?: EHeader;
    withHeader?: boolean;
}): JSX.Element => {
    const [familyCookieId, setGroupCookieId] = useState<string>('');
    const [userCookieId, setUserCookieId] = useState<string>('');

    const [connectedUserName, setConnectedUserName] = useState<string>('');
    const [connectedFamilyName, setConnectedFamilyName] = useState<string>('');

    useEffect(() => {
        const fetchData = async (familyId: string, userId: string): Promise<void> => {
            const result = await axios.get(buildUserInfoUrl(familyId, userId));
            const userInfoResult = result.data as TUserInfoResult;

            if (userInfoResult.success && userInfoResult.groupUser) {
                setConnectedUserName(userInfoResult.groupUser.userName as string);
                setConnectedFamilyName(userInfoResult.groupUser.groupName as string);
            } else {
                onDisconnectClick();
            }
        };

        const familyId = Cookies.get(GROUP_ID_COOKIE) ?? '';
        const userId = Cookies.get(USER_ID_COOKIE) ?? '';
        setGroupCookieId(familyId);
        setUserCookieId(userId);

        if (withHeader) {
            if (!familyId || !userId) {
                onDisconnectClick();
            }

            fetchData(familyId, userId);
        }
    }, [withHeader]);

    const onDisconnectClick = (): void => {
        Cookies.remove(GROUP_ID_COOKIE);
        Cookies.remove(USER_ID_COOKIE);

        Router.push('/');
    };

    return (
        <div className="bg-noel bg-cover">
            <div className="body-padding min-h-body">
                <div className="pt-5 pb-3 flex justify-between">
                    <div className="text-xs md:flex bg-shadow">
                        {connectedUserName && connectedFamilyName && (
                            <>
                                <span className="hidden md:block">Connecté en tant que</span>
                                <b className="pl-1 text-vertNoel">{connectedUserName}</b>
                                <span className="hidden md:block">, dans la famille</span>
                                <br />
                                <b className="pl-1 text-vertNoel">{connectedFamilyName}</b>
                            </>
                        )}
                    </div>

                    <span className="text-xs self-center">
                        <CountDown />
                    </span>
                </div>

                {withHeader && (
                    <CustomHeader
                        selectedHeader={selectedHeader}
                        groupId={familyCookieId}
                        userId={userCookieId}
                        onDisconnectClick={onDisconnectClick}
                    />
                )}

                {children}
            </div>

            <CustomFooter />
        </div>
    );
};

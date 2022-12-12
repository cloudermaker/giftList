import { ReactNode, useEffect, useState } from 'react';
import { CustomFooter } from './customFooter';
import { CustomHeader, EHeader } from './customHeader';
import Cookies from 'js-cookie';
import Router from 'next/router';

export const GROUP_ID_COOKIE = 'giftList_groupName'
export const USER_ID_COOKIE = 'giftList_name'

export const Layout = ({ children, selectedHeader = EHeader.Homepage, withHeader = true} : { children: ReactNode; selectedHeader?: EHeader; withHeader?: boolean }): JSX.Element => {
    const [groupCookieId, setGroupCookieId] = useState<string>('');
    const [userCookieId, setUserCookieId] = useState<string>('');

    useEffect(() => {
        setGroupCookieId(Cookies.get(GROUP_ID_COOKIE) ?? '');
        setUserCookieId(Cookies.get(USER_ID_COOKIE) ?? '');

        if (withHeader) {
            if (!groupCookieId || !userCookieId) {
                Router.push('/');
            }
        }
    }, [groupCookieId, userCookieId, withHeader]);

    const onDisconnectClick = (): void => {
        Cookies.remove(GROUP_ID_COOKIE);
        Cookies.remove(USER_ID_COOKIE);

        Router.push('/');
    }

    return (
        <>
            <div className='m-10'>
                {withHeader && <CustomHeader selectedHeader={selectedHeader} groupId={groupCookieId} userId={userCookieId} onDisconnectClick={onDisconnectClick} />}

                {children}
            </div>

            <CustomFooter />
        </>
    )
}
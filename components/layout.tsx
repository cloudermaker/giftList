import { ReactNode, useEffect } from 'react';
import { CustomFooter } from './customFooter';
import { CustomHeader, EHeader } from './customHeader';
import Cookies from 'js-cookie';
import Router from 'next/router';

export const GROUP_ID_COOKIE = 'giftList_groupName'
export const USER_ID_COOKIE = 'giftList_name'

export const Layout = ({ children, selectedHeader = EHeader.Homepage, withHeader = true} : { children: ReactNode; selectedHeader?: EHeader; withHeader?: boolean }): JSX.Element => {
    const groupId = Cookies.get(GROUP_ID_COOKIE);
    const userId = Cookies.get(USER_ID_COOKIE);

    useEffect(() => {
        if (withHeader) {
            if (!groupId || !userId) {
                Router.push('/');
            }
        }
    }, [groupId, userId, withHeader]);

    const onDisconnectClick = (): void => {
        Cookies.remove(GROUP_ID_COOKIE);
        Cookies.remove(userId);

        Router.push('/');
    }

    return (
        <>
            <div className='m-10'>
                {withHeader && <CustomHeader selectedHeader={selectedHeader} groupId={groupId} userId={userId} onDisconnectClick={onDisconnectClick} />}

                {children}
            </div>

            <CustomFooter />
        </>
    )
}
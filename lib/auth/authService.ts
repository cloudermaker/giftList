import Cookies from 'js-cookie';
import { TGroupAndUser } from '@/pages/api/authenticate';

export const COOKIE_NAME = 'currentUser';
export const BACKOFFICE_SECRET = 'admin';
export const BACKOFFICE_SESSION_KEY = 'backoffice_auth';

export const setAuthCookie = (groupUser: TGroupAndUser): void => {
    Cookies.set(COOKIE_NAME, btoa(JSON.stringify(groupUser)), { sameSite: 'Strict' });
};

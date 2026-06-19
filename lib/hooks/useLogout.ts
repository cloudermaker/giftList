import Cookies from 'js-cookie';
import { COOKIE_NAME, BACKOFFICE_SESSION_KEY } from '../auth/authService';

export const useLogout = () => {
    const logout = () => {
        Cookies.remove(COOKIE_NAME);
        sessionStorage.removeItem(BACKOFFICE_SESSION_KEY);
    };

    return { logout };
};

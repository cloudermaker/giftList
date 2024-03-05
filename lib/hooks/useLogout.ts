import Cookies from 'js-cookie';
import { COOKIE_NAME } from '../auth/authService';

export const useLogout = () => {
    const logout = () => {
        Cookies.remove(COOKIE_NAME);
    };

    return { logout };
};

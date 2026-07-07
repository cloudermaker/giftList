import Cookies from 'js-cookie';
import { COOKIE_NAME } from '../auth/authService';
import AxiosWrapper from '../wrappers/axiosWrapper';

export const useLogout = () => {
    const logout = async () => {
        Cookies.remove(COOKIE_NAME);
        await AxiosWrapper.delete('/api/backoffice/auth');
    };

    return { logout };
};

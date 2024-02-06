import { TAuthenticateResult } from '@/pages/api/authenticate';
import axios from 'axios';
import Cookies from 'js-cookie';
import { COOKIE_NAME } from '../auth/authService';

export const useLogin = () => {
    const login = async (userName: string, groupName: string, isCreating: boolean): Promise<TAuthenticateResult> => {
        const res = await axios.post('api/authenticate', {
            groupName,
            userName,
            isCreating
        });
        const data = res.data as TAuthenticateResult;

        if (data?.success && data.groupUser) {
            Cookies.set(COOKIE_NAME, btoa(JSON.stringify(data.groupUser)));
        }

        return data;
    };

    return { login };
};

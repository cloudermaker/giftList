import { TAuthenticateResult } from '@/pages/api/authenticate';
import { setAuthCookie } from '../auth/authService';
import AxiosWrapper from '../wrappers/axiosWrapper';

export const useLogin = () => {
    const login = async (
        userName: string,
        groupName: string,
        isCreating: boolean,
        password?: string
    ): Promise<TAuthenticateResult> => {
        const res = await AxiosWrapper.post('api/authenticate', {
            groupName,
            userName,
            isCreating,
            password
        });
        const data = res?.data as TAuthenticateResult;

        if (data?.success && data.groupUser) {
            setAuthCookie(data.groupUser);
        }

        return data;
    };

    return { login };
};

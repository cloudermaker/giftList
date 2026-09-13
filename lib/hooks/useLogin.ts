import { TAuthenticateResult } from '@/pages/api/authenticate';
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
        // Le cookie de session signé est posé par le serveur (Set-Cookie)
        return res?.data as TAuthenticateResult;
    };

    return { login };
};

import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { COOKIE_NAME } from '../auth/authService';
import { TGroupAndUser } from '@/pages/api/authenticate';

export const useCurrentUser = () => {
    const [connectedUser, setConnectedUser] = useState<TGroupAndUser | null>(null);

    useEffect(() => {
        const currentUser = Cookies.get(COOKIE_NAME);

        if (currentUser) {
            setConnectedUser(JSON.parse(atob(currentUser)));
        }
    }, []);

    return { connectedUser };
};

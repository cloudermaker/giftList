import Router from 'next/router';
import Cookies from 'js-cookie';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { COOKIE_NAME } from '@/lib/auth/authService';
import { TGroupAndUser } from '@/pages/api/authenticate';

// Cookie signé « payload.signature » : le client ne lit que le payload (la signature n'est vérifiée que côté serveur)
const parseUserCookie = (): TGroupAndUser | null => {
    try {
        const raw = Cookies.get(COOKIE_NAME);
        if (!raw) return null;
        if (!raw.includes('.')) {
            // Ancien cookie non signé (avant v5.2.0) : invalide côté serveur, on le supprime
            Cookies.remove(COOKIE_NAME);
            return null;
        }
        const payload = raw.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(payload)) as TGroupAndUser;
    } catch {
        return null;
    }
};

const UserContext = createContext<{ connectedUser: TGroupAndUser | null }>({ connectedUser: null });

export const UserProvider = ({ children }: { children: ReactNode }): JSX.Element => {
    const [connectedUser, setConnectedUser] = useState<TGroupAndUser | null>(null);

    useEffect(() => {
        setConnectedUser(parseUserCookie());
        const onRouteChange = () => setConnectedUser(parseUserCookie());
        Router.events.on('routeChangeComplete', onRouteChange);
        return () => Router.events.off('routeChangeComplete', onRouteChange);
    }, []);

    return <UserContext.Provider value={{ connectedUser }}>{children}</UserContext.Provider>;
};

export const useUserContext = () => useContext(UserContext);

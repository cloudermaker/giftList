import { useUserContext } from '@/lib/context/UserContext';

// Un seul parse du cookie pour toute l'app (voir UserProvider dans _app.tsx)
export const useCurrentUser = () => useUserContext();

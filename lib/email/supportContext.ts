import type { NextApiRequest } from 'next';
import { getSession } from '@/lib/auth/session';
import { getUserGroups } from '@/lib/db/userGroupManager';
import { getEmailStatus } from '@/lib/auth/emailRecovery';

export type TSupportContextLine = { label: string; value: string };

const SITE_URL = 'https://www.malistedecadeaux.fr';

// Chemin interne uniquement (pas d'URL externe)
export const sanitizeFromPath = (value: unknown): string | null =>
    typeof value === 'string' && /^\/(?!\/)[^\s]{0,199}$/.test(value) ? value : null;

// Contexte du compte lu depuis la session signée, jamais depuis le formulaire
export const buildSupportContext = async (req: NextApiRequest, fromPath: string | null): Promise<TSupportContextLine[]> => {
    const lines: TSupportContextLine[] = [];
    const session = getSession(req);

    if (session) {
        lines.push({ label: 'Utilisateur', value: `${session.userName} (${session.userId})${session.isAdmin ? ' · admin' : ''}` });
        lines.push({ label: 'Groupe actif', value: `${session.groupName} (${session.groupId})` });
        try {
            const groups = await getUserGroups(session.userId);
            if (groups.length > 0) {
                lines.push({
                    label: 'Groupes',
                    value: groups.map((g) => `${g.name} (${g.id}, ${g.role === 'ADMIN' ? 'admin' : 'membre'})`).join(' · ')
                });
            }
            const emailStatus = await getEmailStatus(session.userId);
            lines.push({ label: 'Email lié', value: emailStatus.email ?? 'aucun' });
        } catch (e) {
            console.error('Support context lookup failed:', e);
        }
        if (session.emailAuth) lines.push({ label: 'Connexion', value: 'via lien email' });
    } else {
        lines.push({ label: 'Utilisateur', value: 'non connecté' });
    }

    if (fromPath) lines.push({ label: 'Page', value: `${SITE_URL}${fromPath}` });
    const userAgent = req.headers['user-agent'];
    if (userAgent) lines.push({ label: 'Navigateur', value: userAgent.slice(0, 300) });

    return lines;
};

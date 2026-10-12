import type { NextApiRequest, NextApiResponse } from 'next';
import { hashLegacyAdminPasswords, purgeInactiveGroups } from '@/lib/db/groupManager';

// Maintenance hebdomadaire (purge RGPD + hachage des anciens mots de passe), appelée par Vercel Cron (vercel.json), qui envoie « Authorization: Bearer $CRON_SECRET »
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
        return res.status(401).json({ success: false });
    }
    try {
        const result = { ...(await purgeInactiveGroups()), hashedPasswords: await hashLegacyAdminPasswords() };
        console.info('Weekly maintenance:', result);
        return res.status(200).json({ success: true, ...result });
    } catch (e) {
        console.error('Error in /api/cron/purge:', e);
        return res.status(500).json({ success: false });
    }
}

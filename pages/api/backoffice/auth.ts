import type { NextApiRequest, NextApiResponse } from 'next';
import { BACKOFFICE_COOKIE as COOKIE_NAME, BACKOFFICE_MAX_AGE, signBackofficeToken } from '@/lib/auth/session';
const BASE_ATTRS = `HttpOnly; SameSite=Strict; Path=/`;
const SECURE = process.env.NODE_ENV === 'production' ? '; Secure' : '';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { login, pass } = req.body ?? {};

        const validUser = process.env.BACKOFFICE_USERNAME;
        const validPass = process.env.BACKOFFICE_PASSWORD;

        if (!validUser || !validPass || login !== validUser || pass !== validPass) {
            return res.status(401).json({ success: false });
        }

        res.setHeader('Set-Cookie', `${COOKIE_NAME}=${signBackofficeToken()}; ${BASE_ATTRS}; Max-Age=${BACKOFFICE_MAX_AGE}${SECURE}`);
        return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
        res.setHeader('Set-Cookie', `${COOKIE_NAME}=; ${BASE_ATTRS}; Max-Age=0${SECURE}`);
        return res.status(200).json({ success: true });
    }

    res.status(405).end();
}

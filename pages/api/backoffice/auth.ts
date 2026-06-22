import type { NextApiRequest, NextApiResponse } from 'next';

const COOKIE_NAME = 'backoffice_session';
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

        res.setHeader('Set-Cookie', `${COOKIE_NAME}=1; ${BASE_ATTRS}; Max-Age=${60 * 60 * 8}${SECURE}`);
        return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
        res.setHeader('Set-Cookie', `${COOKIE_NAME}=; ${BASE_ATTRS}; Max-Age=0${SECURE}`);
        return res.status(200).json({ success: true });
    }

    res.status(405).end();
}

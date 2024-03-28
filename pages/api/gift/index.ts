import type { NextApiRequest, NextApiResponse } from 'next';
import { getGiftFromId, updateGifts, upsertGift } from '@/lib/db/giftManager';
import { Gift } from '@prisma/client';
import { getUserById } from '@/lib/db/userManager';
import { COOKIE_NAME } from '@/lib/auth/authService';
import Cookies from 'js-cookie';
import { TGroupAndUser } from '../authenticate';

export type TGiftApiResult = {
    success: boolean;
    giftId?: string;
    gift?: Gift;
    gifts?: Gift[];
    error?: string;
};

const verbsWithAuthorization = ['POST'];
const isAuthorized = async (req: NextApiRequest) => {
    if (!verbsWithAuthorization.includes(req.method as string)) {
        return true;
    }

    const connectedUser = JSON.parse(atob(req.cookies[COOKIE_NAME] as string)) as TGroupAndUser;
    const userGiftId = req.body?.userGiftId ?? req.query?.userGiftId ?? 'None';
    const isGiftAdmin = connectedUser?.isAdmin || connectedUser?.userId === userGiftId;

    return isGiftAdmin;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<TGiftApiResult>) {
    const { body, query } = req;

    try {
        const isAuthorizedRequest = await isAuthorized(req);

        if (!isAuthorizedRequest) {
            res.status(403).json({ success: false });
            return;
        }

        if (req.method === 'GET' && query.giftId) {
            const gift = await getGiftFromId(query.giftId as string);

            if (gift) {
                res.status(200).json({ success: true, gift });
            }

            res.status(404).json({ success: false });
        } else if (req.method === 'POST' && body.gift) {
            const gift = await upsertGift(body.gift as Gift);

            res.status(200).json({ success: true, gift });
        } else if (req.method === 'POST' && body.gifts) {
            const gifts = await updateGifts(body.gifts as Gift[]);

            res.status(200).json({ success: true, gifts });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (e) {
        console.log(e);
        res.status(500).json({ success: false, error: e as string });
    }
}

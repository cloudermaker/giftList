import type { NextApiRequest, NextApiResponse } from 'next';
import { deleteGift, getGiftFromId, updateGift, updateGifts, upsertGift } from '@/lib/db/giftManager';
import { Gift } from '@prisma/client';
import { isString } from 'lodash';
import { getUserById } from '@/lib/db/userManager';

export type TGiftApiResult = {
    success: boolean;
    giftId?: string;
    gift?: Gift;
    gifts?: Gift[];
    error?: string;
};

const verbsWithAuthorization = ['POST', 'PATCH', 'PUT', 'DELETE'];
const isAuthorized = async (req: NextApiRequest) => {
    if (!verbsWithAuthorization.includes(req.method as string)) {
        return true;
    }

    const connectedUser = await getUserById(req.body?.initiatorUserId ?? req.query?.initiatorUserId ?? 'None');
    const userGiftId = req.body?.userGiftId ?? req.query?.userGiftId ?? 'None';
    const isGiftAdmin = connectedUser?.isAdmin || connectedUser?.id === userGiftId;

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
        } else if (req.method === 'PATCH' && body.gift) {
            const gift = await updateGift(body.gift as Gift);

            res.status(200).json({ success: true, gift });
        } else if (req.method === 'PUT' && isString(req.body.gift.id)) {
            const giftToUpdate = await getGiftFromId(req.body.gift.id);

            if (giftToUpdate) {
                const gift = await updateGift({ ...giftToUpdate, ...body.gift });

                res.status(200).json({ success: true, gift });
            }

            res.status(404).json({ success: false, giftId: req.body.giftId });
        } else if (req.method === 'DELETE' && query.giftId) {
            await deleteGift(query.giftId as string);

            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ success: false });
        }
    } catch (e) {
        res.status(500).json({ success: false, error: e as string });
    }
}

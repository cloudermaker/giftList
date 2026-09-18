import { z } from 'zod';
import type { NextApiRequest, NextApiResponse } from 'next';

// Valide req.body ; en cas d'échec répond 400 et renvoie null (l'appelant fait `if (!data) return;`)
export const parseBody = <T extends z.ZodTypeAny>(schema: T, req: NextApiRequest, res: NextApiResponse): z.infer<T> | null => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
        res.status(400).json({ success: false, error: 'Requête invalide.' });
        return null;
    }
    return result.data;
};

const name = z.string().trim().min(1).max(100);
const shortText = z.string().max(200);
const longText = z.string().max(2000);
const id = z.string().min(1).max(100);

export const authenticateSchema = z.object({
    groupName: name,
    userName: name,
    isCreating: z.boolean().optional(),
    password: shortText.optional()
});

export const inviteJoinSchema = z.object({
    token: z.string().min(1).max(64),
    userName: name,
    confirm: z.boolean().optional()
});

// Les objets gift/group/user des bodies portent des champs techniques : on valide l'essentiel, le reste passe
const giftShape = z
    .object({
        name: z.string().trim().min(1).max(200),
        description: longText.nullish(),
        url: longText.nullish(),
        giftType: z.enum(['SIMPLE', 'MULTIPLE', 'UNLIMITED']).optional()
    })
    .passthrough();

export const giftUpsertSchema = z.object({ gift: giftShape }).passthrough();
export const giftsReorderSchema = z.object({ gifts: z.array(giftShape).min(1).max(200) }).passthrough();
export const giftPatchSchema = z.object({ gift: giftShape.partial().passthrough() }).passthrough();

export const takeSchema = z.object({ takenGiftId: id.optional() }).passthrough();

export const subGiftSchema = z.object({
    name: z.string().trim().min(1).max(200),
    description: longText.nullish(),
    url: longText.nullish()
});

const userShape = z.object({ name: name }).passthrough();
export const userCreateSchema = z.object({ user: userShape, groupId: id.optional() }).passthrough();
export const userPatchSchema = z.object({ user: userShape.partial().passthrough(), groupId: id.optional() }).passthrough();

const groupShape = z
    .object({
        name: name.optional(),
        adminPassword: shortText.optional()
    })
    .passthrough();
export const groupCreateSchema = z.object({ group: groupShape.extend({ name: name }) }).passthrough();
export const groupPatchSchema = z.object({ group: groupShape }).passthrough();

export const membershipSchema = z.object({
    userId: id,
    groupId: id,
    role: z.enum(['MEMBER', 'ADMIN']).optional()
});

export const personalGiftCreateSchema = z.object({
    personalGift: z
        .object({
            name: z.string().trim().min(1).max(200),
            description: longText.nullish(),
            url: longText.nullish(),
            forUserId: id.nullish(),
            groupId: id
        })
        .passthrough()
});

export const ideaCreateSchema = z.object({
    title: z.string().trim().min(3).max(100),
    description: z.string().trim().max(500).optional().or(z.literal(''))
});

export const ideaUpdateSchema = z.object({
    done: z.boolean().optional(),
    title: z.string().trim().min(3).max(100).optional(),
    description: z.string().trim().max(500).optional().or(z.literal(''))
});

export const personalGiftUpdateSchema = z
    .object({
        name: z.string().trim().min(1).max(200).optional(),
        description: longText.nullish(),
        url: longText.nullish(),
        forUserId: id.nullish()
    })
    .passthrough();

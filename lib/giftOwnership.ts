// Propriétaire ou second propriétaire (cadeau commun)
export const isGiftOwner = (gift: { userId: string | null; coOwnerId: string | null }, userId: string | undefined): boolean =>
    !!userId && (gift.userId === userId || gift.coOwnerId === userId);

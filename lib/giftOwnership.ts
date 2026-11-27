// Propriétaire ou second propriétaire (cadeau commun)
export const isGiftOwner = (gift: { userId: string | null; coOwnerId: string | null }, userId: string | undefined): boolean =>
    !!userId && (gift.userId === userId || gift.coOwnerId === userId);

// Créateur et partenaire ne reçoivent jamais les réservations de leur cadeau
export const hideReservationsFromOwner = <T extends { takenUserId?: string | null; takenByList?: unknown[] }>(
    gift: T,
    isOwner: boolean
): T => (isOwner ? { ...gift, takenUserId: null, takenByList: [] } : gift);

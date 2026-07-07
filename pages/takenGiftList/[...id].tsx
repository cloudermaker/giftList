import CustomButton from '@/components/atoms/customButton';
import { EHeader } from '@/components/customHeader';
import { Layout } from '@/components/layout';
import { PersonalGiftModal } from '@/components/PersonalGiftModal';
import { getTakenGiftsFromUserId, GiftWithTakenUserId } from '@/lib/db/giftManager';
import { getPersonalGiftsByUser } from '@/lib/db/personalGiftManager';
import { User, GiftType } from '@prisma/client';
import { NextPageContext } from 'next';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import ModernLink from '@/components/atoms/ModernLink';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

const AVATAR_COLORS = [
    { bg: '#fde8e6', text: '#c0392b' },
    { bg: '#e8f2ec', text: '#4a7c59' },
    { bg: '#e8edf5', text: '#4a6fa5' },
    { bg: '#fef3cd', text: '#b8860b' },
    { bg: '#f0ebf8', text: '#7b5ea7' },
    { bg: '#e6f3f5', text: '#2e7d8a' },
];

const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// Type étendu pour inclure forUser (pour les personal gifts)
type GiftWithForUser = GiftWithTakenUserId & { 
    user: User | null;
    forUser?: User | null;
};

const TakenGiftList = ({ takenGifts }: { takenGifts: GiftWithForUser[] }): JSX.Element => {
    const { connectedUser } = useCurrentUser();
    const [localTakenGifts, setLocalTakenGifts] = useState<GiftWithForUser[]>(takenGifts);
    const [groupUsers, setGroupUsers] = useState<User[]>([]);
    const [releasingGiftId, setReleasingGiftId] = useState<string | null>(null);
    const [deletingGiftId, setDeletingGiftId] = useState<string | null>(null);
    const [showPersonalGiftModal, setShowPersonalGiftModal] = useState(false);
    // Charger les users du groupe
    useEffect(() => {
        const loadGroupUsers = async () => {
            if (connectedUser?.groupId) {
                try {
                    const response = await AxiosWrapper.get(`/api/user?groupid=${connectedUser.groupId}`);
                    if (response?.data?.success && response.data.users) {
                        setGroupUsers(response.data.users);
                    }
                } catch (error) {
                    // Silently fail if unable to fetch group users
                }
            }
        };
        loadGroupUsers();
    }, [connectedUser?.groupId]);
    const onUnBlockGiftClick = async (giftToUpdate: GiftWithForUser): Promise<void> => {
        const uniqueKey = giftToUpdate.userTakenGiftId ?? giftToUpdate.id;
        setReleasingGiftId(uniqueKey);
        
        try {
            // Pour les cadeaux UNLIMITED : libérer uniquement cette réservation spécifique
            const body: any = { userId: connectedUser?.userId };
            if ((giftToUpdate.giftType as string) === 'UNLIMITED' && giftToUpdate.userTakenGiftId) {
                body.takenGiftId = giftToUpdate.userTakenGiftId;
            }

            const result = await AxiosWrapper.delete(`/api/gift/${giftToUpdate.id}/take`, body);
            const data = result?.data;

            if (data && data.success) {
                // Retirer uniquement cette entrée (par userTakenGiftId pour éviter de supprimer les doublons UNLIMITED)
                setLocalTakenGifts((oldGifts) => oldGifts.filter((gift) => (gift.userTakenGiftId ?? gift.id) !== uniqueKey));
                Swal.fire({ title: 'Cadeau libéré !', icon: 'success', timer: 1500, showConfirmButton: false });
            } else {
                Swal.fire({ title: 'Erreur', text: 'Impossible de libérer ce cadeau. Réessayez dans quelques instants.', icon: 'error' });
            }
        } finally {
            setReleasingGiftId(null);
        }
    };



    const handleCreatePersonalGift = async (data: { name: string; description: string; link: string; forUserId: string }): Promise<void> => {
        const result = await AxiosWrapper.post('/api/personalGift', {
            personalGift: {
                name: data.name,
                description: data.description || null,
                url: data.link || null,
                userId: connectedUser?.userId,
                groupId: connectedUser?.groupId,
                forUserId: data.forUserId || null
            }
        });
        const res = result?.data;
        if (res && res.success && res.personalGift) {
            const giftFromPersonal: GiftWithForUser = {
                id: res.personalGift.id,
                name: res.personalGift.name,
                description: res.personalGift.description,
                url: res.personalGift.url,
                userId: null,
                takenUserId: connectedUser?.userId,
                user: null,
                forUser: res.personalGift.forUser || null
            } as GiftWithForUser;
            setLocalTakenGifts((old) => [...old, giftFromPersonal]);
            Swal.fire({ title: 'Cadeau ajouté !', icon: 'success', timer: 1500, showConfirmButton: false });
        } else {
            Swal.fire({ title: 'Erreur', text: "Impossible d'ajouter ce cadeau. Réessayez dans quelques instants.", icon: 'error' });
            throw new Error('api error');
        }
    };

    const deletePersonalGift = async (giftId: string): Promise<void> => {
        const swalWithBootstrapButtons = Swal.mixin({
            buttonsStyling: true
        });

        const result = await swalWithBootstrapButtons.fire({
            title: 'Es-tu certain de vouloir supprimer ce cadeau?',
            text: 'Il ne sera pas possible de revenir en arrière!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Oui!',
            cancelButtonText: 'Non!',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            setDeletingGiftId(giftId);
            
            try {
                const apiResult = await AxiosWrapper.delete(`/api/personalGift/${giftId}`, {
                    userId: connectedUser?.userId
                });
                const data = apiResult?.data;

                if (data && data.success === true) {
                    setLocalTakenGifts((oldGifts) => oldGifts.filter((gift) => gift.id !== giftId));
                    swalWithBootstrapButtons.fire({ title: 'Supprimé !', icon: 'success', timer: 1500, showConfirmButton: false });
                } else {
                    swalWithBootstrapButtons.fire({ title: 'Erreur', text: "Impossible de supprimer ce cadeau.", icon: 'error' });
                }
            } finally {
                setDeletingGiftId(null);
            }
        }
    };

    const reservedGifts = localTakenGifts.filter((g) => g.user !== null);
    const personalGifts = localTakenGifts.filter((g) => g.user === null);

    return (
        <Layout selectedHeader={EHeader.TakenGiftList}>
            <div>
                {/* Title */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Mes réservations</h1>
                </div>

                {/* ── Cadeaux réservés ── */}
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Cadeaux réservés</p>
                {reservedGifts.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center mb-8 shadow-sm">
                        <p className="text-3xl mb-2">🎁</p>
                        <p className="text-sm text-gray-400">Aucun cadeau réservé pour le moment</p>
                    </div>
                ) : (
                    <div className="mb-8">
                        {reservedGifts.map((gift, idx) => {
                            const color = avatarColor(gift.user?.name ?? 'A');
                            const uniqueKey = gift.userTakenGiftId ?? gift.id;
                            return (
                                <div key={`takenGift_${idx}`} className="item flex items-center gap-4">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                        style={{ background: color.bg, color: color.text }}
                                    >
                                        {gift.user?.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {(gift as any).parentGift ? (
                                            <p className="font-semibold text-gray-800 truncate">
                                                <span className="font-normal text-gray-400">{(gift as any).parentGift.name} › </span>
                                                {gift.name}
                                            </p>
                                        ) : (
                                            <p className="font-semibold text-gray-800 truncate">{gift.name}</p>
                                        )}
                                        <p className="text-sm text-gray-400 mt-0.5">Pour {gift.user?.name}</p>
                                        {gift.description && <p className="text-sm text-gray-500 mt-1">{gift.description}</p>}
                                        {gift.url && <div className="mt-1"><ModernLink href={gift.url} /></div>}
                                    </div>
                                    <CustomButton
                                        onClick={() => onUnBlockGiftClick(gift)}
                                        disabled={releasingGiftId === uniqueKey}
                                    >
                                        {releasingGiftId === uniqueKey ? '...' : 'Libérer'}
                                    </CustomButton>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Cadeaux personnels ── */}
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1 mt-8">Cadeaux personnels</p>
                <p className="text-sm text-gray-400 mb-4">Visibles uniquement par toi</p>
                {personalGifts.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center mb-6 shadow-sm">
                        <p className="text-3xl mb-2">📝</p>
                        <p className="text-sm text-gray-400">Aucun cadeau personnel ajouté</p>
                    </div>
                ) : (
                    <div className="mb-6">
                        {personalGifts.map((gift, idx) => {
                            const color = gift.forUser ? avatarColor(gift.forUser.name) : { bg: '#f3f4f6', text: '#6b7280' };
                            return (
                                <div key={`personalGift_${idx}`} className="item flex items-center gap-4">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                                        style={{ background: color.bg, color: color.text }}
                                    >
                                        {gift.forUser ? gift.forUser.name.charAt(0).toUpperCase() : '📝'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 truncate">{gift.name}</p>
                                        {gift.forUser && <p className="text-sm text-gray-400 mt-0.5">Pour {gift.forUser.name}</p>}
                                        {gift.description && <p className="text-sm text-gray-500 mt-1">{gift.description}</p>}
                                        {gift.url && <div className="mt-1"><ModernLink href={gift.url} /></div>}
                                    </div>
                                    <CustomButton
                                        onClick={() => deletePersonalGift(gift.id)}
                                        disabled={deletingGiftId === gift.id}
                                    >
                                        {deletingGiftId === gift.id ? '...' : 'Supprimer'}
                                    </CustomButton>
                                </div>
                            );
                        })}
                    </div>
                )}

                <CustomButton className="green-button" onClick={() => setShowPersonalGiftModal(true)}>
                    Ajouter un cadeau personnel
                </CustomButton>

                {showPersonalGiftModal && (
                    <PersonalGiftModal
                        groupUsers={groupUsers}
                        currentUserId={connectedUser?.userId}
                        onClose={() => setShowPersonalGiftModal(false)}
                        onSubmit={handleCreatePersonalGift}
                    />
                )}
            </div>
        </Layout>
    );
};

export async function getServerSideProps(context: NextPageContext) {
    const { query } = context;

    const userId = query.id?.toString() ?? '';

    if (Number.isNaN(userId)) {
        return {
            notFound: true
        };
    }

    // Charger les cadeaux réservés (takenUserId)
    const takenGifts = await getTakenGiftsFromUserId(userId);
    
    // Filtrer pour ne garder QUE les cadeaux qui ont un user (vraies listes)
    // Les cadeaux orphelins (user=null) ne doivent plus apparaître ici
    const takenGiftsWithForUser = takenGifts
        .filter(gift => gift.user !== null)  // Ignorer les orphelins
        .map(gift => ({
            ...gift,
            forUser: null,
            parentGift: (gift as any).parentGift ?? null
        }));
    
    // Charger les cadeaux personnels créés par le user (depuis PersonalGift)
    const personalGifts = await getPersonalGiftsByUser(userId);
    
    // Convertir PersonalGifts en format Gift pour compatibilité
    const personalGiftsAsGifts = personalGifts.map(pg => ({
        id: pg.id,
        name: pg.name,
        description: pg.description,
        url: pg.url,
        userId: null,
        order: 0,
        takenUserId: userId,
        isSuggestedGift: false,
        giftType: 'SIMPLE' as GiftType,
        parentGiftId: null,
        updatedAt: pg.updatedAt,
        createdAt: pg.createdAt,
        user: null,
        forUser: pg.forUser || null
    }));
    
    // Fusionner les deux listes
    const allGifts = [...takenGiftsWithForUser, ...personalGiftsAsGifts];

    return {
        props: {
            takenGifts: allGifts.map((gift) => ({
                ...gift,
                user: gift.user
                    ? {
                          ...gift.user,
                          updatedAt: gift.user.updatedAt?.toISOString() ?? '',
                          createdAt: gift.user.createdAt?.toISOString() ?? ''
                      }
                    : null,
                forUser: gift.forUser
                    ? {
                          ...gift.forUser,
                          updatedAt: gift.forUser.updatedAt?.toISOString() ?? '',
                          createdAt: gift.forUser.createdAt?.toISOString() ?? ''
                      }
                    : null,
                updatedAt: gift.updatedAt?.toISOString() ?? '',
                createdAt: gift.createdAt?.toISOString() ?? '',
                parentGift: (gift as any).parentGift
                    ? {
                          ...(gift as any).parentGift,
                          updatedAt: (gift as any).parentGift.updatedAt?.toISOString() ?? '',
                          createdAt: (gift as any).parentGift.createdAt?.toISOString() ?? ''
                      }
                    : null
            }))
        }
    };
}

export default TakenGiftList;

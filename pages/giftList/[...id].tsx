import { ReactNode, Suspense, useEffect, useState } from 'react';
import { Layout } from '@/components/layout';
import { EHeader } from '@/components/customHeader';
import ModernLink from '@/components/atoms/ModernLink';
import { NextPageContext } from 'next';
import CustomButton from '@/components/atoms/customButton';
import { Medal } from '@/components/icons/medal';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Drag } from '@/components/icons/drag';
import { Gift, User } from '@prisma/client';
import { buildDefaultGift, getGiftsFromUserId, GiftWithTakenUserId } from '@/lib/db/giftManager';
import { TGiftApiResult } from '@/pages/api/gift';
import { getUserById, getUsersFromGroupId } from '@/lib/db/userManager';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import Swal from 'sweetalert2';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import { cloneDeep } from 'lodash';
import { TUserApiResult } from '../api/user';

function SortableItem({
    gift,
    children,
    idx,
    canReorder
}: {
    gift: GiftWithTakenUserId;
    children: ReactNode;
    idx: number;
    canReorder: boolean;
}) {
    const { listeners, setNodeRef, transform } = useSortable({
        id: gift.id
    });

    const style = {
        transform: CSS.Transform.toString(transform)
    };
    const color = idx === 1 ? 'orange' : idx === 2 ? 'silver' : 'brown';
    const localListeners = canReorder ? listeners : null;
    const localStyle = canReorder ? { cursor: 'grab', touchAction: 'none' } : {};

    const LeftIcon = (): JSX.Element => {
        if (idx <= 3) {
            return <Medal className="pr-3 w-9" color={color} />;
        } else if (canReorder) {
            return <Drag className="pr-3 w-9" />;
        }

        return <div className="pr-3 w-9"></div>;
    };

    return (
        <div className="item flex items-center" ref={setNodeRef} style={style}>
            <div {...localListeners} style={localStyle}>
                <LeftIcon />
            </div>

            {children}
        </div>
    );
}

const GiftPage = ({ user, giftList = [] }: { user: User; giftList: GiftWithTakenUserId[] }): JSX.Element => {
    const { connectedUser } = useCurrentUser();

    const userCanAddGift: boolean = user.id === connectedUser?.userId;

    const [localGifts, setLocalGifts] = useState<GiftWithTakenUserId[]>(giftList);
    const [creatingGift, setCreatingGift] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [filteringTakenGifts, setFilteringTakenGifts] = useState<boolean>(false);

    const [newGiftName, setNewGiftName] = useState<string>('');
    const [newDescription, setNewDescription] = useState<string>('');
    const [newLink, setNewLink] = useState<string>('');

    const [updatingGiftId, setUpdatingGiftId] = useState<string>('');

    const [groupUserMap, setGroupUserMap] = useState<{ [key: string]: User }>({});
    const [loadingGroupUsers, setLoadingGroupUsers] = useState<boolean>(true);
    const [revealedGiftIds, setRevealedGiftIds] = useState<Set<string>>(new Set());
    const [takingGiftId, setTakingGiftId] = useState<string | null>(null);

    useEffect(() => {
        const fillTakenUserMap = async () => {
            if (connectedUser?.groupId) {
                setLoadingGroupUsers(true);
                try {
                    const response = await AxiosWrapper.get(`/api/user?groupid=${connectedUser.groupId}`);

                    if (response?.status !== 200) {
                        setLoadingGroupUsers(false);
                        return;
                    }

                    const responseData = response?.data as TUserApiResult;
                    const takenUsers = responseData.users as User[];

                    const newTakenUserMap: { [key: string]: User } = Object.fromEntries(
                        takenUsers.map((takenUser) => [takenUser.id, takenUser])
                    );

                    setGroupUserMap(newTakenUserMap);
                    setLoadingGroupUsers(false);
                } catch (error) {
                    console.error('Erreur lors du chargement des utilisateurs du groupe:', error);
                    setLoadingGroupUsers(false);
                }
            }
        };

        fillTakenUserMap();
    }, [connectedUser?.groupId]);

    const clearAllFields = (): void => {
        setCreatingGift(false);
        setError('');
        setNewGiftName('');
        setNewDescription('');
        setNewLink('');
        setUpdatingGiftId('');
    };

    const removeGift = async (giftId: string): Promise<void> => {
        const swalWithBootstrapButtons = Swal.mixin({
            buttonsStyling: true
        });

        swalWithBootstrapButtons
            .fire({
                title: 'Es-tu certain de vouloir supprimer ce cadeau ?',
                text: 'Il ne sera pas possible de revenir en arrière!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Oui!',
                cancelButtonText: 'Non!',
                reverseButtons: true
            })
            .then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const result = await AxiosWrapper.delete(`/api/gift/${giftId}`);
                        const data = result?.data as TGiftApiResult;

                        if (data && data.success === true) {
                            setLocalGifts(localGifts.filter((gift) => gift.id !== giftId));
                            clearAllFields();

                            swalWithBootstrapButtons.fire({
                                title: 'Supprimé!',
                                text: 'Le cadeau a été supprimé.',
                                icon: 'success'
                            });
                        } else {
                            swalWithBootstrapButtons.fire({
                                title: 'Erreur',
                                text: data?.error || 'Impossible de supprimer ce cadeau. Réessayez dans quelques instants.',
                                icon: 'error'
                            });
                        }
                    } catch (error: any) {
                        const errorMessage = error?.response?.data?.error || error?.message || 'Impossible de supprimer ce cadeau. Réessayez dans quelques instants.';
                        swalWithBootstrapButtons.fire({
                            title: 'Erreur',
                            text: errorMessage,
                            icon: 'error'
                        });
                    }
                }
            });
    };

    const updatingGift = (gift: Gift): void => {
        // Annuler la création en cours si active
        if (creatingGift) {
            setCreatingGift(false);
        }
        
        setNewGiftName(gift.name);
        setNewDescription(gift.description ?? '');
        setNewLink(gift.url ?? '');
        setUpdatingGiftId(gift.id);
    };

    const upsertGift = async (giftId: string | null = null): Promise<void> => {
        const currentGift: GiftWithTakenUserId = cloneDeep(localGifts.filter((gift) => gift.id === giftId)[0]);
        const giftToUpsert: GiftWithTakenUserId = currentGift ?? buildDefaultGift(user.id, localGifts.length);

        giftToUpsert.name = newGiftName;
        giftToUpsert.description = newDescription;
        giftToUpsert.url = newLink;

        let newGifts: GiftWithTakenUserId[] = localGifts;
        try {
            if (giftId) {
                // Update
                const result = await AxiosWrapper.patch(`/api/gift/${giftId}`, {
                    gift: giftToUpsert
                });
                const data = result?.data as TGiftApiResult;

                if (data && data.success === true && data.gift) {
                    const giftWithTakenUserId: GiftWithTakenUserId = {
                        ...data.gift,
                        takenUserId: (data.gift as any).takenUserId ?? null
                    };
                    const currentUserToUpdateId = newGifts.findIndex((gift) => gift.id === giftId);
                    newGifts[currentUserToUpdateId] = giftWithTakenUserId;
                } else {
                    Swal.fire({
                        title: 'Erreur',
                        text: data?.error || 'Impossible de modifier ce cadeau. Réessayez dans quelques instants.',
                        icon: 'error'
                    });
                }
            } else {
                // Create
                const result = await AxiosWrapper.post('/api/gift', {
                    gift: giftToUpsert,
                    initiatorUserId: connectedUser?.userId,
                    userGiftId: user.id
                });
                const data = result?.data as TGiftApiResult;

                if (data && data.success === true && data.gift) {
                    const giftWithTakenUserId: GiftWithTakenUserId = {
                        ...data.gift,
                        takenUserId: (data.gift as any).takenUserId ?? null
                    };
                    newGifts.push(giftWithTakenUserId);
                } else {
                    Swal.fire({
                        title: 'Erreur',
                        text: data?.error || 'Impossible d\'ajouter ce cadeau. Réessayez dans quelques instants.',
                        icon: 'error'
                    });
                }
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error || error?.message || 'Impossible de sauvegarder ce cadeau. Réessayez dans quelques instants.';
            Swal.fire({
                title: 'Erreur',
                text: errorMessage,
                icon: 'error'
            });
        }

        setLocalGifts(newGifts);
        clearAllFields();
    };

    const onCreatingGiftButtonClick = (): void => {
        // Annuler la modification en cours si active
        if (updatingGiftId !== '') {
            setUpdatingGiftId('');
            setNewGiftName('');
            setNewDescription('');
            setNewLink('');
        }
        
        setCreatingGift(true);

        window.setTimeout(function () {
            document.getElementById('newGiftInputId')?.focus();
        }, 0);
    };

    const onBlockUnBlockGiftClick = async (giftToUpdate: GiftWithTakenUserId): Promise<void> => {
        const isTaken = giftToUpdate.takenUserId != null;
        setTakingGiftId(giftToUpdate.id);
        
        try {
            let result;
            if (isTaken) {
                // Libérer le cadeau (DELETE)
                result = await AxiosWrapper.delete(`/api/gift/${giftToUpdate.id}/take`, {
                    userId: connectedUser?.userId
                });
            } else {
                // Réserver le cadeau (POST)
                result = await AxiosWrapper.post(`/api/gift/${giftToUpdate.id}/take`, {
                    userId: connectedUser?.userId
                });
            }
            
            const data = result?.data;

            if (data && data.success) {
                // Recharger le cadeau pour obtenir les données à jour
                const refreshResult = await AxiosWrapper.get(`/api/gift?giftId=${giftToUpdate.id}`);
                const refreshData = refreshResult?.data as TGiftApiResult;
                
                if (refreshData && refreshData.success && refreshData.gift) {
                    const giftWithTakenUserId: GiftWithTakenUserId = {
                        ...refreshData.gift,
                        takenUserId: (refreshData.gift as any).takenUserId ?? null
                    };
                    const newLocalGifts: GiftWithTakenUserId[] = localGifts.map(gift => 
                        gift.id === giftToUpdate.id ? giftWithTakenUserId : gift
                    );
                    setLocalGifts(newLocalGifts);
                }
            } else {
                Swal.fire({
                    title: 'Erreur',
                    text: data?.error || 'Impossible de réserver ce cadeau. Réessayez dans quelques instants.',
                    icon: 'error'
                });
            }
        } catch (error) {
            Swal.fire({
                title: 'Erreur',
                text: `Erreur lors de la réservation: ${error}`,
                icon: 'error'
            });
        } finally {
            setTakingGiftId(null);
        }
    };

    const buildStyleIfTaken = (gift: GiftWithTakenUserId): string => {
        if (gift.userId !== connectedUser?.userId && gift.takenUserId != null) {
            return 'line-through';
        }

        return '';
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    function handleDragEnd(event: { active: any; over: any }) {
        const { active, over } = event;

        if (active.id !== over.id) {
            setLocalGifts((prevLocalGifts) => {
                const oldIndex = prevLocalGifts.findIndex((gift) => gift.id === active.id);
                const newIndex = prevLocalGifts.findIndex((gift) => gift.id === over.id);

                const newGifts: GiftWithTakenUserId[] = arrayMove(prevLocalGifts, oldIndex, newIndex);

                // Update position of all gifts
                for (let i = 0; i < newGifts.length; i++) {
                    newGifts[i].order = i + 1;
                }

                AxiosWrapper.post('/api/gift', {
                    gifts: newGifts,
                    initiatorUserId: connectedUser?.userId,
                    userGiftId: user.id
                }).catch(error => {
                    console.error('Erreur lors de la mise à jour de l\'ordre des cadeaux:', error);
                });

                return newGifts;
            });
        }
    }

    const pageTitle = user.id === connectedUser?.userId 
        ? 'Ma liste de cadeaux' 
        : `Liste de cadeaux de ${user.name}`;

    return (
        <Layout selectedHeader={EHeader.GiftList} pageTitle={pageTitle}>
            <div className="mb-10">
                <h1>{`Voici la liste de cadeaux pour ${user.name}:`}</h1>

                {connectedUser?.userId !== user.id && (
                    <div className="flex pb-4">
                        Je veux cacher les cadeaux déja pris:
                        <input
                            className="ml-2 cursor-pointer w-6 accent-vertNoel"
                            type="checkbox"
                            onChange={() => setFilteringTakenGifts(!filteringTakenGifts)}
                        />
                    </div>
                )}

                <Suspense fallback="loading...">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={localGifts}>
                            {localGifts
                                .filter((gift) => !filteringTakenGifts || !gift.takenUserId)
                                .map((gift, idx) => (
                                    <SortableItem key={`gift_${gift.id}`} gift={gift} idx={idx + 1} canReorder={userCanAddGift}>
                                        <div className="block md:flex justify-between items-center w-full">
                                            {updatingGiftId !== gift.id && (
                                                <div className={`w-full block ${buildStyleIfTaken(gift)}`}>
                                                    <p className="py-1">
                                                        <b className="pr-2">Nom:</b>
                                                        <span>{gift.name}</span>
                                                    </p>

                                                    {gift.description && (
                                                        <p className="py-1">
                                                            <b className="pr-2">Description:</b>
                                                            <span>{gift.description}</span>
                                                        </p>
                                                    )}

                                                    {gift.url && (
                                                        <p className="py-1">
                                                            <ModernLink href={gift.url} />
                                                        </p>
                                                    )}

                                                    {connectedUser?.isAdmin && (
                                                        <i>
                                                            <div className="flex">
                                                                <span className="pr-2">Créé:</span>
                                                                {gift.createdAt?.toLocaleString()}
                                                            </div>

                                                            <div className="flex">
                                                                <span className="pr-2">Mis à jour:</span>
                                                                {gift.updatedAt?.toString()}
                                                            </div>
                                                        </i>
                                                    )}
                                                </div>
                                            )}

                                            {updatingGiftId === gift.id && (
                                                <div className={`w-full pr-4 block ${buildStyleIfTaken(gift)}`}>
                                                    <div className="py-2 grid md:flex">
                                                        <label className="input-label">Nom:</label>
                                                        <textarea
                                                            id="newGiftInputId"
                                                            className="input-field"
                                                            value={newGiftName}
                                                            onChange={(e) => setNewGiftName(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="py-2 grid md:flex">
                                                        <label className="input-label">Description:</label>
                                                        <textarea
                                                            className="input-field"
                                                            value={newDescription}
                                                            onChange={(e) => setNewDescription(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="py-2 grid md:flex">
                                                        <label className="input-label">Lien:</label>
                                                        <textarea
                                                            className="input-field"
                                                            value={newLink}
                                                            onChange={(e) => setNewLink(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="pt-4 md:pt-0 justify-end flex">
                                                {userCanAddGift &&
                                                    (updatingGiftId === gift.id ? (
                                                        <>
                                                            <CustomButton
                                                                onClick={() => upsertGift(gift.id)}
                                                                disabled={newGiftName == null || newGiftName === ''}
                                                                className="green-button"
                                                            >
                                                                Valider
                                                            </CustomButton>
                                                            <CustomButton onClick={clearAllFields}>Annuler</CustomButton>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CustomButton
                                                                className="green-button"
                                                                onClick={() => updatingGift(gift)}
                                                            >
                                                                Modifier
                                                            </CustomButton>
                                                            <CustomButton onClick={() => removeGift(gift.id)}>
                                                                Supprimer
                                                            </CustomButton>
                                                        </>
                                                    ))}

                                                {!userCanAddGift && gift.takenUserId === connectedUser?.userId && (
                                                    <CustomButton 
                                                        onClick={() => onBlockUnBlockGiftClick(gift)}
                                                        disabled={takingGiftId === gift.id}
                                                    >
                                                        {takingGiftId === gift.id ? 'Libération...' : 'Je ne prends plus ce cadeau'}
                                                    </CustomButton>
                                                )}

                                                {!userCanAddGift &&
                                                    gift.takenUserId &&
                                                    gift.takenUserId !== connectedUser?.userId && (
                                                        <>
                                                            {(loadingGroupUsers ||
                                                                !groupUserMap ||
                                                                !groupUserMap[gift.takenUserId]) && (
                                                                <span className="text-red-500 text-center">
                                                                    Ce cadeau est déjà pris
                                                                </span>
                                                            )}
                                                            {!loadingGroupUsers &&
                                                                groupUserMap[gift.takenUserId] &&
                                                                !revealedGiftIds.has(gift.id) && (
                                                                    <span
                                                                        className="text-red-500 text-center cursor-pointer"
                                                                        onClick={() =>
                                                                            setRevealedGiftIds((prev) => {
                                                                                const newSet = new Set(prev);
                                                                                newSet.add(gift.id);
                                                                                return newSet;
                                                                            })
                                                                        }
                                                                    >
                                                                        Ce cadeau est déjà pris <br />
                                                                        (cliquer pour révéler)
                                                                    </span>
                                                                )}
                                                            {!loadingGroupUsers && revealedGiftIds.has(gift.id) && (
                                                                <span
                                                                    className="text-red-500 text-center cursor-pointer"
                                                                    onClick={() =>
                                                                        setRevealedGiftIds((prev) => {
                                                                            const newSet = new Set([...prev]);
                                                                            newSet.delete(gift.id);
                                                                            return newSet;
                                                                        })
                                                                    }
                                                                >
                                                                    Ce cadeau est déjà pris <br />
                                                                    (par{' '}
                                                                    <b>
                                                                        {groupUserMap[gift.takenUserId]?.name ||
                                                                            'Utilisateur inconnu'}
                                                                    </b>
                                                                    )
                                                                </span>
                                                            )}
                                                        </>
                                                    )}

                                                {!userCanAddGift &&
                                                    !gift.takenUserId &&
                                                    gift.takenUserId !== connectedUser?.userId && (
                                                        <CustomButton
                                                            className="green-button"
                                                            onClick={() => onBlockUnBlockGiftClick(gift)}
                                                            disabled={takingGiftId === gift.id}
                                                        >
                                                            {takingGiftId === gift.id ? 'Réservation...' : 'Je prends ce cadeau'}
                                                        </CustomButton>
                                                    )}
                                            </div>
                                        </div>
                                    </SortableItem>
                                ))}
                        </SortableContext>
                    </DndContext>
                </Suspense>

                {!creatingGift && (
                    <CustomButton className="green-button" onClick={onCreatingGiftButtonClick}>
                        Ajouter un cadeau
                    </CustomButton>
                )}

                {creatingGift && (
                    <div className="block pt-3 item">
                        <b>Ajouter ce nouveau cadeau:</b>
                        {error && <p>{error}</p>}

                        <div className="input-group pt-3">
                            <label className="input-label">Nom:</label>
                            <textarea
                                id="newGiftInputId"
                                className="input-field"
                                value={newGiftName}
                                onChange={(e) => setNewGiftName(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Description:</label>
                            <textarea
                                className="input-field"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Lien:</label>
                            <textarea className="input-field" value={newLink} onChange={(e) => setNewLink(e.target.value)} />
                        </div>

                        <div className="py-2">
                            <CustomButton className="green-button" onClick={() => upsertGift()} disabled={newGiftName === ''}>
                                Ajouter
                            </CustomButton>

                            <CustomButton
                                onClick={() => {
                                    setNewGiftName('');
                                    setNewDescription('');
                                    setNewLink('');
                                    setCreatingGift(false);
                                    setError('');
                                }}
                            >
                                Cancel
                            </CustomButton>
                        </div>
                    </div>
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

    const user = await getUserById(userId);
    const giftList = await getGiftsFromUserId(userId);

    return {
        props: {
            user: {
                ...user,
                updatedAt: user?.updatedAt?.toISOString() ?? '',
                createdAt: user?.createdAt?.toISOString() ?? ''
            },
            giftList: giftList.map((gift) => ({
                ...gift,
                updatedAt: gift.updatedAt?.toISOString() ?? '',
                createdAt: gift.createdAt?.toISOString() ?? ''
            }))
        }
    };
}

export default GiftPage;

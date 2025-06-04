import { ReactNode, Suspense, useState } from 'react';
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
import { buildDefaultGift, getGiftsFromUserId } from '@/lib/db/giftManager';
import { TGiftApiResult } from '@/pages/api/gift';
import { getUserById } from '@/lib/db/userManager';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import Swal from 'sweetalert2';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import { cloneDeep } from 'lodash';

function SortableItem({
    gift,
    children,
    idx,
    canReorder
}: {
    gift: Gift;
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

const GiftPage = ({ user, giftList = [] }: { user: User; giftList: Gift[] }): JSX.Element => {
    const { connectedUser } = useCurrentUser();

    const userCanAddGift: boolean = user.id === connectedUser?.userId;

    const [localGifts, setLocalGifts] = useState<Gift[]>(giftList);
    const [creatingGift, setCreatingGift] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [filteringTakenGifts, setFilteringTakenGifts] = useState<boolean>(false);

    const [newGiftName, setNewGiftName] = useState<string>('');
    const [newDescription, setNewDescription] = useState<string>('');
    const [newLink, setNewLink] = useState<string>('');

    const [updatingGiftId, setUpdatingGiftId] = useState<string>('');

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
                    const result = await AxiosWrapper.delete(`/api/gift/${giftId}`);
                    const data = result?.data as TGiftApiResult;

                    if (data && data.success === true) {
                        setLocalGifts(localGifts.filter((gift) => gift.id !== giftId));
                        clearAllFields();
                    } else {
                        swalWithBootstrapButtons.fire({
                            title: 'Erreur',
                            text: `Mince, ça n'a pas fonctionné: ${data?.error ?? '...'}`,
                            icon: 'error'
                        });
                    }

                    swalWithBootstrapButtons.fire({
                        title: 'Supprimé!',
                        text: 'Le cadeau a été supprimé.',
                        icon: 'success'
                    });
                }
            });
    };

    const updatingGift = (gift: Gift): void => {
        setNewGiftName(gift.name);
        setNewDescription(gift.description ?? '');
        setNewLink(gift.url ?? '');
        setUpdatingGiftId(gift.id);
    };

    const upsertGift = async (giftId: string | null = null): Promise<void> => {
        const currentGift: Gift = cloneDeep(localGifts.filter((gift) => gift.id === giftId)[0]);
        const giftToUpsert: Gift = currentGift ?? buildDefaultGift(user.id, localGifts.length);

        giftToUpsert.name = newGiftName;
        giftToUpsert.description = newDescription;
        giftToUpsert.url = newLink;

        let newGifts: Gift[] = localGifts;
        if (giftId) {
            // Update
            const result = await AxiosWrapper.patch(`/api/gift/${giftId}`, {
                gift: giftToUpsert
            });
            const data = result?.data as TGiftApiResult;

            if (data && data.success === true && data.gift) {
                const currentUserToUpdateId = newGifts.findIndex((gift) => gift.id === giftId);
                newGifts[currentUserToUpdateId] = data.gift;
            } else {
                newGifts = localGifts;
                clearAllFields();
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
                newGifts.push(data.gift);
            } else {
                newGifts = localGifts;
                clearAllFields();
            }
        }

        setLocalGifts(newGifts);
        clearAllFields();
    };

    const onCreatingGiftButtonClick = (): void => {
        setCreatingGift(true);

        window.setTimeout(function () {
            document.getElementById('newGiftInputId')?.focus();
        }, 0);
    };

    const onBlockUnBlockGiftClick = async (giftToUpdate: Gift): Promise<void> => {
        const result = await AxiosWrapper.put(`/api/gift/${giftToUpdate.id}`, {
            gift: {
                id: giftToUpdate.id,
                takenUserId: giftToUpdate.takenUserId != null ? null : connectedUser?.userId
            }
        });
        const data = result?.data as TGiftApiResult;

        if (data && data.success && data.gift) {
            const newLocalGifts: Gift[] = [];

            for (const gift of localGifts) {
                if (gift.id === giftToUpdate.id) {
                    newLocalGifts.push(data.gift);
                } else {
                    newLocalGifts.push(gift);
                }
            }

            setLocalGifts(newLocalGifts);
        } else {
            Swal.fire({
                title: 'Erreur',
                text: `Mince, ça n'a pas fonctionné: ${data?.error ?? '...'}`,
                icon: 'error'
            });
        }
    };

    const buildStyleIfTaken = (gift: Gift): string => {
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

                const newGifts: Gift[] = arrayMove(prevLocalGifts, oldIndex, newIndex);

                // Update position of all gifts
                for (let i = 0; i < newGifts.length; i++) {
                    newGifts[i].order = i + 1;
                }

                AxiosWrapper.post('/api/gift', {
                    gifts: newGifts,
                    initiatorUserId: connectedUser?.userId,
                    userGiftId: user.id
                });

                return newGifts;
            });
        }
    }

    return (
        <Layout selectedHeader={EHeader.GiftList}>
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
                                        <div className="flex justify-between items-center w-full">
                                            {updatingGiftId !== gift.id && (
                                                <div className={`w-full block ${buildStyleIfTaken(gift)}`}>
                                                    <p>
                                                        <b className="pr-2">Nom:</b>
                                                        {gift.name}
                                                    </p>

                                                    {gift.description && (
                                                        <p>
                                                            <b className="pr-2">Description:</b>
                                                            {gift.description}
                                                        </p>
                                                    )}

                                                    {gift.url && (
                                                        <div className="mt-2">
                                                            <ModernLink href={gift.url} />
                                                        </div>
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
                                                <div className={`block ${buildStyleIfTaken(gift)}`}>
                                                    <div className="grid md:flex">
                                                        <b className="pr-2">Nom:</b>
                                                        <input
                                                            id="newGiftInputId"
                                                            className="px-3 py-1.5 bg-white/50 border border-neutral-200 rounded-lg focus:outline-none focus:border-vertNoel focus:ring-1 focus:ring-vertNoel transition-all duration-200"
                                                            value={newGiftName}
                                                            onChange={(e) => setNewGiftName(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="grid md:flex">
                                                        <b className="pr-2">Description:</b>
                                                        <input
                                                            className="px-3 py-1.5 bg-white/50 border border-neutral-200 rounded-lg focus:outline-none focus:border-vertNoel focus:ring-1 focus:ring-vertNoel transition-all duration-200"
                                                            value={newDescription}
                                                            onChange={(e) => setNewDescription(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="grid md:flex">
                                                        <b className="pr-2">Lien:</b>
                                                        <input
                                                            className="px-3 py-1.5 bg-white/50 border border-neutral-200 rounded-lg focus:outline-none focus:border-vertNoel focus:ring-1 focus:ring-vertNoel transition-all duration-200"
                                                            value={newLink}
                                                            onChange={(e) => setNewLink(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-right block md:flex">
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
                                                    <CustomButton onClick={() => onBlockUnBlockGiftClick(gift)}>
                                                        Je ne prends plus ce cadeau
                                                    </CustomButton>
                                                )}

                                                {!userCanAddGift &&
                                                    gift.takenUserId &&
                                                    gift.takenUserId !== connectedUser?.userId && (
                                                        <span className="text-red-500">Ce cadeau est déjà pris</span>
                                                    )}

                                                {!userCanAddGift &&
                                                    !gift.takenUserId &&
                                                    gift.takenUserId !== connectedUser?.userId && (
                                                        <CustomButton
                                                            className="green-button"
                                                            onClick={() => onBlockUnBlockGiftClick(gift)}
                                                        >
                                                            Je prends ce cadeau
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
                    <div className="block pt-3">
                        <b>Ajouter ce nouveau cadeau:</b>
                        {error && <p>{error}</p>}

                        <div className="input-group pt-3">
                            <label className="input-label">Nom:</label>
                            <input
                                id="newGiftInputId"
                                className="input-field"
                                value={newGiftName}
                                onChange={(e) => setNewGiftName(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Description:</label>
                            <input
                                className="input-field"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Lien:</label>
                            <input className="input-field" value={newLink} onChange={(e) => setNewLink(e.target.value)} />
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

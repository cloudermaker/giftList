import { ReactNode, useEffect, useState } from 'react';
import { Layout, USER_ID_COOKIE } from '@/components/layout';
import axios from 'axios';
import { EHeader } from '@/components/customHeader';
import { NextPageContext } from 'next';
import Cookies from 'js-cookie';
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
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [userCookieId, setUserCookieId] = useState<string>('');
    const userCanAddGift: boolean = user.id === userCookieId;

    const [localGifts, setLocalGifts] = useState<Gift[]>(giftList);
    const [creatingGift, setCreatingGift] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [filteringTakenGifts, setFilteringTakenGifts] = useState<boolean>(false);

    const [newGiftName, setNewGiftName] = useState<string>('');
    const [newDescription, setNewDescription] = useState<string>('');
    const [newLink, setNewLink] = useState<string>('');

    const [updatingGiftId, setUpdatingGiftId] = useState<string>('');

    useEffect(() => {
        setUserCookieId(Cookies.get(USER_ID_COOKIE) ?? '');
        setIsLoaded(true);
    }, []);

    const clearAllFields = (): void => {
        setCreatingGift(false);
        setError('');
        setNewGiftName('');
        setNewDescription('');
        setNewLink('');
        setUpdatingGiftId('');
    };

    const removeGift = async (giftId: string): Promise<void> => {
        const confirmation = window.confirm('Es-tu certain de vouloir supprimer ce cadeau ?');

        if (confirmation) {
            const result = await axios.delete(`/api/gift?giftId=${giftId}`);
            const data = result.data as TGiftApiResult;

            if (data.success === true) {
                setLocalGifts(localGifts.filter((gift) => gift.id !== giftId));
                clearAllFields();
            } else {
                alert(data.error);
            }
        }
    };

    const updatingGift = (gift: Gift): void => {
        setNewGiftName(gift.name);
        setNewDescription(gift.description ?? '');
        setNewLink(gift.url ?? '');
        setUpdatingGiftId(gift.id);
    };

    const upsertGift = async (giftId: string | null = null): Promise<void> => {
        const currentGift: Gift = localGifts.filter((gift) => gift.id === giftId)[0];
        const giftToUpsert: Gift = currentGift ?? buildDefaultGift(user.id, localGifts.length);

        giftToUpsert.name = newGiftName;
        giftToUpsert.description = newDescription;
        giftToUpsert.url = newLink;

        const result = await axios.post('/api/gift', {
            gift: giftToUpsert
        });
        const data = result.data as TGiftApiResult;

        if (data.success === true && data.gift) {
            let newGifts: Gift[] = localGifts;

            if (giftId) {
                // Update
                const currentUserToUpdateId = newGifts.findIndex((gift) => gift.id === giftId);
                newGifts[currentUserToUpdateId] = data.gift;
            } else {
                // Create
                newGifts.push(data.gift);
            }

            setLocalGifts(newGifts);
            clearAllFields();
        } else {
            setError(data.error ?? 'An error occured');
        }
    };

    const onCreatingGiftButtonClick = (): void => {
        setCreatingGift(true);

        window.setTimeout(function () {
            document.getElementById('newGiftInputId')?.focus();
        }, 0);
    };

    const onBlockUnBlockGiftClick = async (giftToUpdate: Gift): Promise<void> => {
        const result = await axios.put('/api/gift', {
            gift: {
                id: giftToUpdate.id,
                takenUserId: giftToUpdate.takenUserId != null ? null : userCookieId
            }
        });
        const data = result.data as TGiftApiResult;

        if (data.success && data.gift) {
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
            window.alert(data.error);
        }
    };

    const buildStyleIfTaken = (gift: Gift): string => {
        if (gift.userId !== userCookieId && gift.takenUserId != null) {
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

                axios.post('/api/gift', {
                    gifts: newGifts
                });

                return newGifts;
            });
        }
    }

    return (
        <Layout selectedHeader={EHeader.GiftList}>
            <div className="mb-10">
                <h1>{`Voici la liste de cadeaux pour ${user.name}:`}</h1>

                {userCookieId && user.id && userCookieId !== user.id && (
                    <div className="flex pb-4">
                        Je veux cacher les cadeaux déja pris:
                        <input
                            className="ml-2 cursor-pointer w-6 accent-vertNoel"
                            type="checkbox"
                            onChange={() => setFilteringTakenGifts(!filteringTakenGifts)}
                        />
                    </div>
                )}

                {isLoaded && (
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
                                                        <div className="flex">
                                                            <span>{'->'}</span>
                                                            <a href={gift.url}>Lien</a>
                                                            <span>{'<-'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {updatingGiftId === gift.id && (
                                                <div className={`block ${buildStyleIfTaken(gift)}`}>
                                                    <div className="grid md:flex">
                                                        <b className="pr-2">Nom:</b>
                                                        <input
                                                            id="newGiftInputId"
                                                            className="bg-transparent"
                                                            value={newGiftName}
                                                            onChange={(e) => setNewGiftName(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="grid md:flex">
                                                        <b className="pr-2">Description:</b>
                                                        <input
                                                            className="bg-transparent"
                                                            value={newDescription}
                                                            onChange={(e) => setNewDescription(e.target.value)}
                                                        />
                                                    </div>

                                                    <div className="grid md:flex">
                                                        <b className="pr-2">Lien:</b>
                                                        <input
                                                            className="bg-transparent"
                                                            value={newLink}
                                                            onChange={(e) => setNewLink(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="text-right block md:flex">
                                                {userCanAddGift && (
                                                    <>
                                                        {updatingGiftId === gift.id && (
                                                            <CustomButton
                                                                onClick={() => upsertGift(gift.id)}
                                                                disabled={newGiftName == null || newGiftName === ''}
                                                            >
                                                                Valider
                                                            </CustomButton>
                                                        )}
                                                        {updatingGiftId === gift.id && (
                                                            <CustomButton onClick={clearAllFields}>Annuler</CustomButton>
                                                        )}
                                                        {updatingGiftId !== gift.id && (
                                                            <>
                                                                <CustomButton onClick={() => updatingGift(gift)}>
                                                                    Modifier
                                                                </CustomButton>
                                                                <CustomButton onClick={() => removeGift(gift.id)}>
                                                                    Supprimer
                                                                </CustomButton>
                                                            </>
                                                        )}
                                                    </>
                                                )}

                                                {gift && userCookieId && !userCanAddGift && gift.takenUserId === userCookieId && (
                                                    <CustomButton onClick={() => onBlockUnBlockGiftClick(gift)}>
                                                        Je ne prends plus ce cadeau
                                                    </CustomButton>
                                                )}

                                                {gift &&
                                                    userCookieId &&
                                                    !userCanAddGift &&
                                                    gift.takenUserId &&
                                                    gift.takenUserId !== userCookieId && (
                                                        <span className="text-red-500">Ce cadeau est déjà pris</span>
                                                    )}

                                                {gift &&
                                                    userCookieId &&
                                                    !userCanAddGift &&
                                                    !gift.takenUserId &&
                                                    gift.takenUserId !== userCookieId && (
                                                        <CustomButton onClick={() => onBlockUnBlockGiftClick(gift)}>
                                                            Je prends ce cadeau
                                                        </CustomButton>
                                                    )}
                                            </div>
                                        </div>
                                    </SortableItem>
                                ))}
                        </SortableContext>
                    </DndContext>
                )}

                {!creatingGift && <CustomButton onClick={onCreatingGiftButtonClick}>Ajouter un cadeau</CustomButton>}

                {creatingGift && (
                    <div className="block pt-3">
                        <b>Ajouter ce nouveau cadeau:</b>
                        {error && <p>{error}</p>}

                        <div className="flex">
                            <b className="pr-2">Nom:</b>
                            <input
                                id="newGiftInputId"
                                className="bg-transparent"
                                value={newGiftName}
                                onChange={(e) => setNewGiftName(e.target.value)}
                            />
                        </div>

                        <div className="flex">
                            <b className="pr-2">Description:</b>
                            <input
                                className="bg-transparent"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                            />
                        </div>

                        <div className="flex">
                            <b className="pr-2">Lien:</b>
                            <input className="bg-transparent" value={newLink} onChange={(e) => setNewLink(e.target.value)} />
                        </div>

                        <div className="py-2">
                            <CustomButton onClick={() => upsertGift()} disabled={newGiftName === ''}>
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
                updatedAt: user?.updatedAt?.toISOString(),
                createdAt: user?.createdAt?.toISOString()
            },
            giftList: giftList.map((gift) => ({
                ...gift,
                updatedAt: gift.updatedAt?.toISOString(),
                createdAt: gift.createdAt?.toISOString()
            }))
        }
    };
}

export default GiftPage;

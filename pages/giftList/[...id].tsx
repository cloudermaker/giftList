import { ReactNode, useEffect, useState } from 'react';
import { Layout, USER_ID_COOKIE } from '../../components/layout';
import axios from 'axios';
import { EHeader } from '../../components/customHeader';
import { NextPageContext } from 'next';
import { TRemoveGiftResult } from '../api/gift/remove';
import { TCreateGiftInput, TCreateGiftResult } from '../api/gift/create';
import Cookies from 'js-cookie';
import { sanitize } from '../../lib/helpers/stringHelper';
import { clone } from 'lodash';
import CustomButton from '../../components/atoms/customButton';
import { Medal } from '../../components/icons/medal';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Drag } from '../../components/icons/drag';
import { Gift, User } from '@prisma/client';
import { getUserFromId } from '@/lib/db/dbManager';
import { getGiftsFromUserId } from '@/lib/db/giftManager';

function SortableItem({ gift, children, idx, canReorder }: { gift: Gift; children: ReactNode; idx: number; canReorder: boolean }) {
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
        <>
            <div className="item flex items-center" ref={setNodeRef} style={style}>
                <div {...localListeners} style={localStyle}>
                    <LeftIcon />
                </div>

                {children}
            </div>
        </>
    );
}

const GiftPage = ({ user, giftList = [] }: { user: User; giftList: Gift[] }): JSX.Element => {
    const [userCookieId, setUserCookieId] = useState<string>('');
    const userCanAddGift: boolean = user.id === userCookieId;

    const [localGifts, setLocalGifts] = useState<Gift[]>(giftList);
    const [creatingGift, setCreatingGift] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const [newGiftName, setNewGiftName] = useState<string>('');
    const [newDescription, setNewDescription] = useState<string>('');
    const [newLink, setNewLink] = useState<string>('');

    const [updatingGiftId, setUpdatingGiftId] = useState<string>('');

    useEffect(() => {
        setUserCookieId(Cookies.get(USER_ID_COOKIE) ?? '');
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
            const result = await axios.post('/api/gift/removeGift', { giftId });
            const data = result.data as TRemoveGiftResult;

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

    const createGift = async (giftId?: string): Promise<void> => {
        const giftToAdd: TCreateGiftInput = {
            name: sanitize(newGiftName),
            description: sanitize(newDescription),
            url: sanitize(newLink),
            ownerUserId: user.id
        };

        const result = await axios.post('/api/gift/create', {
            userGift: giftToAdd
        });
        const data = result.data as TCreateGiftResult;

        if (data.success === true && data.gift) {
            let newGifts: Gift[] = localGifts;

            newGifts.push(data.gift);

            setLocalGifts(newGifts);
            clearAllFields();
        } else {
            setError(data.error);
        }
    };

    const updateGift = async (giftId: string): Promise<void> => {
        const giftToUpdate: TCreateGiftInput = {
            name: sanitize(newGiftName),
            description: sanitize(newDescription),
            url: sanitize(newLink),
            ownerUserId: user.id
        };

        const result = await axios.post('/api/gift/create', {
            userGift: giftToAdd
        });
        const data = result.data as TCreateGiftResult;

        if (data.success === true) {
            let newGifts: Gift[] = localGifts;
            giftToAdd.id = giftId ?? data.giftId;

            if (giftId) {
                const tmpGifts: Gift[] = [];
                for (const gift of newGifts) {
                    if (gift.id === giftId) {
                        tmpGifts.push(giftToAdd);
                    } else {
                        tmpGifts.push(gift);
                    }
                }
                newGifts = tmpGifts;
            } else {
                newGifts.push(giftToAdd);
            }

            setLocalGifts(newGifts);
            clearAllFields();
        } else {
            setError(data.error);
        }
    };

    const onCreatingGiftButtonClick = (): void => {
        setCreatingGift(true);

        window.setTimeout(function () {
            document.getElementById('newGiftInputId')?.focus();
        }, 0);
    };

    const onblockUnclockGiftClick = async (giftToUpdate: Gift): Promise<void> => {
        const userGift = clone(giftToUpdate);
        userGift.takenUserId = userGift.takenUserId != null ? null : userCookieId;

        const result = await axios.post('/api/gift/addOrUpdateGift', {
            userGift: userGift
        });
        const data = result.data as TAddOrUpdateGiftResult;

        if (data.success === true) {
            const newLocalGifts: Gift[] = [];
            localGifts.forEach((gift) => {
                if (gift.id !== giftToUpdate.id) {
                    newLocalGifts.push(gift);
                } else {
                    newLocalGifts.push(userGift);
                }
            });
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

        // TODO: fix, id 0 is never draggable ?!
        if (active.id !== over.id) {
            setLocalGifts((prevLocalGifts) => {
                const oldIndex = prevLocalGifts.findIndex((gift) => gift.id === active.id);
                const newIndex = prevLocalGifts.findIndex((gift) => gift.id === over.id);

                const newImages = arrayMove(prevLocalGifts, oldIndex, newIndex);

                // Update position of all gifts
                for (let i = 0; i < newImages.length; i++) {
                    newImages[i].order = i + 1;
                }

                axios.post('/api/gift/updateAllPositionGift', {
                    newGifts: newImages
                });

                return newImages;
            });
        }
    }

    return (
        <Layout selectedHeader={EHeader.GiftList}>
            <div className="mb-10">
                <h1>{`Voici la liste de cadeaux pour ${user.name}:`}</h1>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={localGifts}>
                        {localGifts.map((gift, idx) => (
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
                                                <input className="bg-transparent" value={newLink} onChange={(e) => setNewLink(e.target.value)} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-right block md:flex">
                                        {userCanAddGift && (
                                            <>
                                                {updatingGiftId === gift.id && <CustomButton onClick={clearAllFields}>Annuler</CustomButton>}
                                                {updatingGiftId === gift.id && (
                                                    <CustomButton
                                                        onClick={() => addOrUpdateGift(gift.id)}
                                                        disabled={newGiftName == null || newGiftName === ''}
                                                    >
                                                        Valider
                                                    </CustomButton>
                                                )}
                                                {updatingGiftId !== gift.id && (
                                                    <>
                                                        <CustomButton onClick={() => updatingGift(gift)}>Modifier</CustomButton>
                                                        <CustomButton onClick={() => removeGift(gift.id)}>Supprimer</CustomButton>
                                                    </>
                                                )}
                                            </>
                                        )}

                                        {!userCanAddGift && gift.takenUserId === userCookieId && (
                                            <CustomButton onClick={() => onblockUnclockGiftClick(gift)}>Je ne prends plus ce cadeau</CustomButton>
                                        )}

                                        {!userCanAddGift && gift.takenUserId && gift.takenUserId !== userCookieId && (
                                            <span className="text-red-500">Ce cadeau est déjà pris</span>
                                        )}

                                        {!userCanAddGift && !gift.takenUserId && gift.takenUserId !== userCookieId && (
                                            <CustomButton onClick={() => onblockUnclockGiftClick(gift)}>Je prends ce cadeau</CustomButton>
                                        )}
                                    </div>
                                </div>
                            </SortableItem>
                        ))}
                    </SortableContext>
                </DndContext>

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
                            <input className="bg-transparent" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
                        </div>

                        <div className="flex">
                            <b className="pr-2">Lien:</b>
                            <input className="bg-transparent" value={newLink} onChange={(e) => setNewLink(e.target.value)} />
                        </div>

                        <div className="py-2">
                            <CustomButton onClick={() => createGift()} disabled={newGiftName === ''}>
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

    const userId = query.id as string;

    if (Number.isNaN(userId)) {
        return {
            notFound: true
        };
    }

    const user = await getUserFromId(userId);
    const giftList = await getGiftsFromUserId(userId);

    return {
        props: {
            user,
            giftList
        }
    };
}

export default GiftPage;

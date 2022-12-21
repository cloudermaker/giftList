import { useEffect, useState } from 'react';
import { Layout, USER_ID_COOKIE } from '../../components/layout';
import { getUserFromId, getUserGiftsFromUserId } from '../../lib/db/dbManager';
import { TFamilyUser } from '../../lib/types/family';
import axios from 'axios';
import { EHeader } from '../../components/customHeader';
import { NextPageContext } from 'next';
import { TUserGift } from '../../lib/types/gift';
import { TRemoveGiftResult } from '../api/gift/removeGift';
import { TAddOrUpdateGiftResult } from '../api/gift/addOrUpdateGift';
import Cookies from 'js-cookie';
import { sanitize } from '../../lib/helpers/stringHelper';
import { clone } from 'lodash';

const Family = ({ user, giftList = [] }: { user: TFamilyUser; giftList: TUserGift[] }): JSX.Element => {
    const [userCookieId, setUserCookieId] = useState<string>('');
    const userCanAddGift: boolean = user.id === userCookieId;

    const [localGifts, setLocalGifts] = useState<TUserGift[]>(giftList);
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

    const updatingGift = (gift: TUserGift): void => {
        setNewGiftName(gift.name);
        setNewDescription(gift.description);
        setNewLink(gift.url);
        setUpdatingGiftId(gift.id);
    };

    const addOrUpdateGift = async (giftId?: string): Promise<void> => {
        const giftToAdd: TUserGift = {
            id: giftId ?? '0',
            name: sanitize(newGiftName),
            description: sanitize(newDescription),
            url: sanitize(newLink),
            owner_user_id: user.id,
            taken_user_id: undefined
        };

        const result = await axios.post('/api/gift/addOrUpdateGift', {
            userGift: giftToAdd
        });
        const data = result.data as TAddOrUpdateGiftResult;

        if (data.success === true) {
            let newGifts: TUserGift[] = localGifts;
            giftToAdd.id = giftId ?? data.giftId;

            if (giftId) {
                const tmpGifts: TUserGift[] = [];
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

    const onblockUnclockGiftClick = async (giftToUpdate: TUserGift): Promise<void> => {
        const userGift = clone(giftToUpdate);
        userGift.taken_user_id = userGift.taken_user_id != null ? undefined : userCookieId;

        const result = await axios.post('/api/gift/addOrUpdateGift', {
            userGift: userGift
        });
        const data = result.data as TAddOrUpdateGiftResult;

        if (data.success === true) {
            const newLocalGifts: TUserGift[] = [];
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

    const shouldShowIfTaken = (gift: TUserGift): boolean => {
        return gift.owner_user_id !== userCookieId && gift.taken_user_id != null;
    };

    return (
        <Layout selectedHeader={EHeader.GiftList}>
            <h1>{`Voici la liste de cadeaux pour ${user.name}:`}</h1>

            {localGifts.map((gift) => (
                <div className="item flex justify-between items-center" key={`gift_${gift.id}`}>
                    {updatingGiftId !== gift.id && (
                        <div className={`block ${shouldShowIfTaken(gift) ? 'line-through' : ''}`}>
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
                        <div className={`block ${shouldShowIfTaken(gift) ? 'line-through' : ''}`}>
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
                        </div>
                    )}

                    {userCanAddGift && (
                        <div>
                            {updatingGiftId === gift.id && <button onClick={clearAllFields}>Annuler</button>}
                            {updatingGiftId === gift.id && (
                                <button onClick={() => addOrUpdateGift(gift.id)} disabled={newGiftName == null || newGiftName === ''}>
                                    Valider
                                </button>
                            )}
                            {updatingGiftId !== gift.id && <button onClick={() => updatingGift(gift)}>Modifier</button>}
                            <button onClick={() => removeGift(gift.id)}>Supprimer</button>
                        </div>
                    )}

                    {!userCanAddGift && gift.taken_user_id === userCookieId && (
                        <button onClick={() => onblockUnclockGiftClick(gift)}>Je ne prends plus ce cadeau</button>
                    )}

                    {!userCanAddGift && gift.taken_user_id && gift.taken_user_id !== userCookieId && (
                        <span className="text-red-500">Ce cadeau est déjà pris</span>
                    )}

                    {!userCanAddGift && !gift.taken_user_id && gift.taken_user_id !== userCookieId && (
                        <button onClick={() => onblockUnclockGiftClick(gift)}>Je prends ce cadeau</button>
                    )}
                </div>
            ))}

            {!creatingGift && <button onClick={onCreatingGiftButtonClick}>Ajouter un cadeau</button>}

            {creatingGift && (
                <div className="block pt-3">
                    <b>Ajouter ce nouveau cadeau:</b>
                    {error && <p>{error}</p>}

                    <div className="flex">
                        <b className="pr-2">Nom:</b>
                        <input id="newGiftInputId" className="bg-transparent" value={newGiftName} onChange={(e) => setNewGiftName(e.target.value)} />
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
                        <button onClick={() => addOrUpdateGift()} disabled={newGiftName === ''}>
                            Add
                        </button>

                        <button
                            onClick={() => {
                                setNewGiftName('');
                                setNewDescription('');
                                setNewLink('');
                                setCreatingGift(false);
                                setError('');
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
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
    const giftList = await getUserGiftsFromUserId(userId);

    return {
        props: {
            user,
            giftList
        }
    };
}

export default Family;

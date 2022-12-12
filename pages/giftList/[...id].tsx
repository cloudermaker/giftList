import { useEffect, useState } from "react";
import { Layout, USER_ID_COOKIE } from "../../components/layout";
import { getUserFromId, getUserGiftsFromUserId } from "../../lib/db/dbManager";
import { TFamilyUser } from "../../lib/types/family";
import axios from 'axios';
import { EHeader } from "../../components/customHeader";
import { NextPageContext } from "next";
import { TUserGift } from "../../lib/types/gift";
import { TRemoveGiftResult } from "../api/gift/removeGift";
import { TAddOrUpdateGiftResult } from "../api/gift/addOrUpdateGift";
import Cookies from 'js-cookie';

const Family = ({ user, giftList = [] }: { user: TFamilyUser, giftList: TUserGift[] }): JSX.Element => {
    const [userCookieId, setUserCookieId] = useState<string>('');
    const userCanAddGift: boolean = user.id === userCookieId;

    const [localGifts, setLocalGifts] = useState<TUserGift[]>(giftList);
    const [creatingGift, setCreatingGift] = useState<boolean>(false);

    const [newGiftName, setNewGiftName] = useState<string>('');
    const [newDescription, setNewDescription] = useState<string>('');
    const [newLink, setNewLink] = useState<string>('');
    
    useEffect(() => {
        setUserCookieId(Cookies.get(USER_ID_COOKIE) ?? '');
    }, []);

    const removeGift = async (giftId: string): Promise<void> => {
        const confirmation = window.confirm('Are you sure you want to remove this gift ?');

        if (confirmation) {
            const result = await axios.post('/api/gift/removeGift', { giftId });
            const data = result.data as TRemoveGiftResult;
    
            if (data.success === true) {
                location.reload();
            } else {
                window.alert(data.error);
            }
        }
    }

    const addGift = async (): Promise<void> => {
        const newGifts: TUserGift[] = localGifts;

        const giftToAdd: TUserGift = { id: '0', name: newGiftName, description: newDescription, url: newLink, owner_user_id: user.id, taken_user_id: undefined };
        newGifts.push(giftToAdd);

        const result = await axios.post('/api/gift/addOrUpdateGift', { userGift: giftToAdd });
        const data = result.data as TAddOrUpdateGiftResult;

        if (data.success === true) {
            location.reload();
        } else {
            window.alert(data.error);
        }
    }

    const onCreatingGiftButtonClick = (): void => {
        setCreatingGift(true);
        
        window.setTimeout(function () { 
            document.getElementById('newGiftInputId')?.focus(); 
        }, 0); 
    }

    const onUnblockGiftClick = async (giftToUpdate: TUserGift): Promise<void> => {
        const userGift = giftToUpdate;
        userGift.taken_user_id = undefined;

        const result = await axios.post('/api/gift/addOrUpdateGift', { userGift: userGift });
        const data = result.data as TAddOrUpdateGiftResult;

        if (data.success === true) {
            location.reload();
        } else {
            window.alert(data.error);
        }
    }

    const onblockGiftClick = async (giftToUpdate: TUserGift): Promise<void> => {
        const userGift = giftToUpdate;
        userGift.taken_user_id = userCookieId;

        const result = await axios.post('/api/gift/addOrUpdateGift', { userGift: userGift });
        const data = result.data as TAddOrUpdateGiftResult;

        if (data.success === true) {
            location.reload();
        } else {
            window.alert(data.error);
        }
    }    

    return (
        <Layout selectedHeader={EHeader.GiftList}>
            <h1>{`This is the gift list of user: ${user.name}`}</h1>

            <h2>Gifts:</h2>
            <hr />

            {localGifts.map((gift) => (
                <div className="block" key={`gift_${gift.id}`}>
                    <div className={`flex justify-between`}>
                        <div className={`block ${gift.taken_user_id ? 'line-through' : ''}`}>
                            <p>{`Name: ${gift.name}`}</p>

                            {gift.description && <p>{`Description: ${gift.description}`}</p>}

                            {gift.url && 
                                <div className="flex">
                                    <span>{'->'}</span>
                                    <a href={gift.url}>link</a>
                                    <span>{'<-'}</span>
                                </div>
                            }
                        </div>

                        {userCanAddGift && (
                            <div>
                                <button onClick={() => removeGift(gift.id)}>Remove gift</button>
                            </div>
                        )}

                        {!userCanAddGift && gift.taken_user_id === userCookieId && (
                            <button onClick={() => onUnblockGiftClick(gift)}>
                                Unblock gift
                            </button>
                        )}

                        {!userCanAddGift && gift.taken_user_id && gift.taken_user_id !== userCookieId && (
                            <span className="text-red-500">This gift is taken</span>
                        )}                        

                        {!userCanAddGift && !gift.taken_user_id && gift.taken_user_id !== userCookieId && (
                            <button onClick={() => onblockGiftClick(gift)}>
                                Block gift
                            </button>
                        )}                          
                    </div>

                    <hr />
                </div>
            ))}

            {userCanAddGift && !creatingGift && <button onClick={onCreatingGiftButtonClick}>Add new gift</button>}

            {userCanAddGift && creatingGift && 
                <div className="block">
                    <span>Add new gift:</span>
                    <div className="flex">
                        <span>Name:</span>
                        <input id="newGiftInputId" value={newGiftName} onChange={(e) => setNewGiftName(e.target.value)} />
                    </div>

                    <div className="flex">
                        <span>Description:</span>                                        
                        <input value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
                    </div>

                    <div className="flex">
                        <span>Link:</span>
                        <input value={newLink} onChange={(e) => setNewLink(e.target.value)} />
                    </div>

                    <div className="py-2">
                        <button onClick={addGift} disabled={newGiftName === ''}>Add</button>

                        <button onClick={() => {
                            setNewGiftName("");
                            setNewDescription("");
                            setNewLink("");
                            setCreatingGift(false);
                        }}>Cancel</button>
                    </div>
                </div>
            }
            
        </Layout>
    )
}

export async function getServerSideProps(context: NextPageContext) {
    const { query } = context;

    const userId = query.id as string;

    if (Number.isNaN(userId)) {
        return {
            notFound: true,
        }
    }

    const user = await getUserFromId(userId);
    const giftList = await getUserGiftsFromUserId(userId);
    
    return {
      props: {
        user,
        giftList,
      },
    }
  }

export default Family;
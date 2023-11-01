import { useState } from 'react';
import { Layout } from '../../components/layout';
import { getFamilyFromId, getFamilyUsersFromFamilyId } from '../../lib/db/dbManager';
import { TFamily, TFamilyUser } from '../../lib/types/family';
import axios from 'axios';
import { EHeader } from '../../components/customHeader';
import { TRemoveUserResult } from '../api/user/removeUser';
import { NextPageContext } from 'next';
import { TAddUserResult } from '../api/user/addOrUpdateUser';
import { sanitize } from '../../lib/helpers/stringHelper';
import CustomButton from '../../components/atoms/customButton';

const Family = ({ family, familyUsers = [] }: { family: TFamily; familyUsers: TFamilyUser[] }): JSX.Element => {
    const [localUsers, setLocalUsers] = useState<TFamilyUser[]>(familyUsers);
    const [creatingUser, setCreatingUser] = useState<boolean>(false);
    const [updatingUserId, setUpdatingUserId] = useState<string>('');
    const [newUserName, setNewUserName] = useState<string>('');
    const [addError, setAddError] = useState<string>('');

    const removeUser = async (userId: string): Promise<void> => {
        const confirmation = window.confirm('Tu es sûr de vouloir supprimer cet utilisateur ?\nToute sa liste de cadeau le sera également.');

        if (confirmation) {
            const result = await axios.post('/api/user/removeUser', { userId });
            const data = result.data as TRemoveUserResult;

            if (data.success === true) {
                setLocalUsers(localUsers.filter((user) => user.id !== userId));
                setCreatingUser(false);
                setNewUserName('');
            } else {
                window.alert(data.error);
            }
        }
    };

    const addOrUpdateUser = async (userId?: string): Promise<void> => {
        const userToAdd: TFamilyUser = {
            id: userId ?? '0',
            name: sanitize(newUserName),
            family_id: family.id
        };

        const result = await axios.post('/api/user/addOrUpdateUser', {
            familyUser: userToAdd
        });
        const data = result.data as TAddUserResult;

        if (data.success === true) {
            let newUsers: TFamilyUser[] = localUsers;
            userToAdd.id = userId ?? data.userId;

            if (userId) {
                const tmpUsers: TFamilyUser[] = [];
                for (const user of newUsers) {
                    if (user.id === userId) {
                        tmpUsers.push(userToAdd);
                    } else {
                        tmpUsers.push(user);
                    }
                }
                newUsers = tmpUsers;
            } else {
                newUsers.push(userToAdd);
            }

            setLocalUsers(newUsers);
            clearAllFields();
        } else {
            window.alert(data.error);
        }
    };

    const updatingUser = (user: TFamilyUser): void => {
        setUpdatingUserId(user.id);
        setNewUserName(user.name);
    };

    const onCreatingUserButtonClick = (): void => {
        setCreatingUser(true);

        window.setTimeout(function () {
            document.getElementById('newUserInputId')?.focus();
        }, 0);
    };

    const clearAllFields = (): void => {
        setCreatingUser(false);
        setNewUserName('');
        setUpdatingUserId('');
        setAddError('');
    };

    return (
        <Layout selectedHeader={EHeader.Family}>
            <div className="mb-10">
                <h1 className="pb-5">{`Voici la famille: ${family.name}`}</h1>

                {localUsers.map((user) => (
                    <div className="item flex justify-between items-center" key={`family_${user.id}`}>
                        <span className="w-full md:w-auto">
                            <b className="pr-2">Nom:</b>

                            {updatingUserId === user.id && <input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />}
                            {updatingUserId !== user.id && <span>{user.name}</span>}
                        </span>

                        <div className="block md:flex items-center text-center">
                            {updatingUserId !== user.id && (
                                <>
                                    <a href={`/giftList/${user.id}`}>Liste de cadeaux</a>

                                    <div className="flex">
                                        <CustomButton className="mt-3 md:mt-0" onClick={() => updatingUser(user)}>
                                            Modifier
                                        </CustomButton>

                                        <CustomButton className="mt-3 md:mt-0" onClick={() => removeUser(user.id)}>
                                            Supprimer
                                        </CustomButton>
                                    </div>
                                </>
                            )}

                            {updatingUserId === user.id && (
                                <>
                                    <div className="flex">
                                        <CustomButton
                                            className="mt-3 md:mt-0"
                                            onClick={() => addOrUpdateUser(user.id)}
                                            disabled={newUserName == null || newUserName === ''}
                                        >
                                            Valider
                                        </CustomButton>

                                        <CustomButton className="mt-3 md:mt-0" onClick={clearAllFields}>
                                            Annuler
                                        </CustomButton>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {!creatingUser && <CustomButton onClick={onCreatingUserButtonClick}>Ajouter un utilisateur</CustomButton>}

                {creatingUser && (
                    <div className="pb-5 pl-3">
                        {addError && <div className="text-red-500 font-bold">{addError}</div>}

                        <b className="mr-2">Nom:</b>
                        <input id="newUserInputId" className="bg-transparent" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />

                        <div className="mt-2">
                            <CustomButton onClick={() => addOrUpdateUser()} disabled={newUserName === ''}>
                                Ajouter
                            </CustomButton>

                            <CustomButton
                                onClick={() => {
                                    setNewUserName('');
                                    setCreatingUser(false);
                                }}
                            >
                                Annuler
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

    const familyId = query.id as string;

    if (Number.isNaN(familyId)) {
        return {
            notFound: true
        };
    }

    const family = await getFamilyFromId(familyId);
    const familyUsers = await getFamilyUsersFromFamilyId(familyId);

    return {
        props: {
            family,
            familyUsers
        }
    };
}

export default Family;

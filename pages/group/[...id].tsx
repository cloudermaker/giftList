import { useState } from 'react';
import { Layout } from '@/components/layout';
import axios from 'axios';
import { EHeader } from '@/components/customHeader';
import { NextPageContext } from 'next';
import { sanitize } from '@/lib/helpers/stringHelper';
import CustomButton from '@/components/atoms/customButton';
import { TUserApiResult } from '@/pages/api/user';
import { getGroupById } from '@/lib/db/groupManager';
import { buildDefaultUser, getUsersFromGroupId } from '@/lib/db/userManager';
import { User, Group } from '@prisma/client';

const Group = ({ group, groupUsers = [] }: { group: Group; groupUsers: User[] }): JSX.Element => {
    const [localUsers, setLocalUsers] = useState<User[]>(groupUsers);
    const [creatingUser, setCreatingUser] = useState<boolean>(false);
    const [updatingUserId, setUpdatingUserId] = useState<string>('');
    const [newUserName, setNewUserName] = useState<string>('');
    const [addError, setAddError] = useState<string>('');

    const removeUser = async (userId: string): Promise<void> => {
        const confirmation = window.confirm(
            'Tu es sûr de vouloir supprimer cet utilisateur ?\nToute sa liste de cadeau le sera également.'
        );

        if (confirmation) {
            const result = await axios.delete(`/api/user?userId=${userId}`, { params: {} });
            const data = result.data as TUserApiResult;

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
        const currentUserToAdd = localUsers.filter((user) => user.id === userId)[0];
        const userToAdd: User =
            { ...currentUserToAdd, name: sanitize(newUserName) } ?? buildDefaultUser(sanitize(newUserName), group.id);

        const result = await axios.post('/api/user', {
            user: userToAdd
        });
        const data = result.data as TUserApiResult;

        if (data.success === true && data.userId) {
            let newUsers: User[] = localUsers;
            userToAdd.id = userId ?? data.userId;

            if (userId) {
                // Update
                const tmpUsers: User[] = [];
                for (const user of newUsers) {
                    if (user.id === userId) {
                        tmpUsers.push(userToAdd);
                    } else {
                        tmpUsers.push(user);
                    }
                }
                newUsers = tmpUsers;
            } else {
                // Create
                newUsers.push(userToAdd);
            }

            setLocalUsers(newUsers);
            clearAllFields();
        } else {
            window.alert(data.error ?? 'An error occured');
        }
    };

    const updatingUser = (user: User): void => {
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
        <Layout selectedHeader={EHeader.Group}>
            <div className="mb-10">
                <h1 className="pb-5">{`Voici le groupe: ${group.name}`}</h1>

                {localUsers.map((user) => (
                    <div className="item flex justify-between items-center" key={`group_${user.id}`}>
                        <span className="w-full md:w-auto">
                            <b className="pr-2">Nom:</b>

                            {updatingUserId === user.id && (
                                <input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />
                            )}
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
                        <input
                            id="newUserInputId"
                            className="bg-transparent"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                        />

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

    const groupId = query.id as string;

    if (Number.isNaN(groupId)) {
        return {
            notFound: true
        };
    }

    const group = await getGroupById(groupId);
    const groupUsers = await getUsersFromGroupId(groupId);

    return {
        props: {
            group,
            groupUsers
        }
    };
}

export default Group;
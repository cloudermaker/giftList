import { useState } from 'react';
import { Layout } from '@/components/layout';
import { EHeader } from '@/components/customHeader';
import { NextPageContext } from 'next';
import CustomButton from '@/components/atoms/customButton';
import { TUserApiResult } from '@/pages/api/user';
import { getGroupById } from '@/lib/db/groupManager';
import { buildDefaultUser, getUsersFromGroupId } from '@/lib/db/userManager';
import { User, Group } from '@prisma/client';
import Router from 'next/router';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import Swal from 'sweetalert2';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';

const GroupComponent = ({ group, groupUsers = [] }: { group: Group; groupUsers: User[] }): JSX.Element => {
    const { connectedUser } = useCurrentUser();

    const [localUsers, setLocalUsers] = useState<User[]>(groupUsers);
    const [creatingUser, setCreatingUser] = useState<boolean>(false);
    const [updatingUserId, setUpdatingUserId] = useState<string | undefined>(undefined);
    const [newUserName, setNewUserName] = useState<string>('');
    const [addError, setAddError] = useState<string>('');

    const removeUser = async (userId: string): Promise<void> => {
        const swalWithBootstrapButtons = Swal.mixin({
            buttonsStyling: true
        });

        swalWithBootstrapButtons
            .fire({
                title: 'Es-tu certain de vouloir supprimer cet utilisateur?',
                text: 'Il ne sera pas possible de revenir en arrière!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Oui!',
                cancelButtonText: 'Non!',
                reverseButtons: true
            })
            .then(async (result) => {
                if (result.isConfirmed) {
                    const apiResult = await AxiosWrapper.delete(`/api/user/${userId ?? 'toto'}`);
                    const data = apiResult?.data as TUserApiResult;

                    if (data?.success === true) {
                        setLocalUsers(localUsers.filter((user) => user.id !== userId));

                        swalWithBootstrapButtons.fire({
                            title: 'Supprimé!',
                            text: "L'utilisateur a été supprimé.",
                            icon: 'success'
                        });
                    } else {
                        swalWithBootstrapButtons.fire({
                            title: 'Erreur',
                            text: `Mince, ça n'a pas fonctionné: ${data?.error ?? '...'}`,
                            icon: 'error'
                        });
                    }
                }
            });
    };

    const addOrUpdateUser = async (userId?: string): Promise<void> => {
        const currentUserToAdd = localUsers.filter((user) => user.id === userId)[0];

        let userToAdd: User = currentUserToAdd ?? buildDefaultUser(group.id);
        userToAdd.name = newUserName.trim();

        const response = await AxiosWrapper.post('/api/user', {
            user: userToAdd,
            initiatorUserId: connectedUser?.userId ?? ''
        });
        const data = response?.data as TUserApiResult;

        if (data?.success === true && data?.user) {
            let newUsers: User[] = localUsers;

            if (userId) {
                // Update
                const currentUserToUpdateId = newUsers.findIndex((user) => user.id === userId);
                newUsers[currentUserToUpdateId] = data.user;
            } else {
                // Create
                newUsers.push(data.user);
            }

            setLocalUsers(newUsers);
        } else {
            Swal.fire({
                title: 'Erreur',
                text: `Mince, ça n'a pas fonctionné: ${data?.error ?? 'erreur technique'}`,
                icon: 'error'
            });
        }

        clearAllFields();
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
        setUpdatingUserId(undefined);
        setAddError('');
    };

    return (
        <Layout selectedHeader={EHeader.Group}>
            <div className="mb-10">
                <h1 className="pb-5">{`Voici le groupe: ${group.name}`}</h1>

                {localUsers.map((user) => (
                    <div className="item" key={`group_${user.id}`}>
                        <div className="flex justify-between items-center">
                            <span className="w-full md:w-auto">
                                <b className="pr-2">Nom:</b>

                                {updatingUserId === user.id && (
                                    <input
                                        name="updateUserInput"
                                        className="w-full px-3 py-1.5 bg-white/50 border border-neutral-200 rounded-lg focus:outline-none focus:border-vertNoel focus:ring-1 focus:ring-vertNoel transition-all duration-200"
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                    />
                                )}
                                {updatingUserId !== user.id && <span>{user.name}</span>}
                            </span>

                            <div className="block md:flex items-center text-center">
                                {updatingUserId !== user.id && (
                                    <>
                                        <CustomButton
                                            className="green-button mt-3 md:mt-0"
                                            onClick={() => Router.push(`/giftList/${user.id}`)}
                                        >
                                            Liste de cadeaux
                                        </CustomButton>

                                        {connectedUser?.isAdmin && (
                                            <div className="md:flex">
                                                <CustomButton
                                                    className="green-button mt-3 md:mt-0"
                                                    onClick={() => updatingUser(user)}
                                                >
                                                    Modifier
                                                </CustomButton>

                                                <CustomButton className="mt-3 md:mt-0" onClick={() => removeUser(user.id)}>
                                                    Supprimer
                                                </CustomButton>
                                            </div>
                                        )}
                                    </>
                                )}

                                {connectedUser?.isAdmin && updatingUserId === user.id && (
                                    <>
                                        <div className="md:flex">
                                            <CustomButton
                                                className="green-button mt-3 md:mt-0"
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

                        {connectedUser?.isAdmin && (
                            <i className="flex pt-4">
                                <span className="pr-2">Créé:</span>
                                {user.createdAt?.toLocaleString()}
                            </i>
                        )}
                    </div>
                ))}

                {connectedUser?.isAdmin && (
                    <>
                        {!creatingUser && (
                            <CustomButton className="green-button" onClick={onCreatingUserButtonClick}>
                                Ajouter un utilisateur
                            </CustomButton>
                        )}

                        {creatingUser && (
                            <div className="pb-5 pl-3">
                                {addError && <div className="text-red-500 font-bold">{addError}</div>}

                                <div className="input-group">
                                    <label className="input-label">Nom:</label>
                                    <input
                                        id="newUserInputId"
                                        className="input-field"
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                    />
                                </div>

                                <div className="mt-2">
                                    <CustomButton
                                        className="green-button"
                                        onClick={() => addOrUpdateUser()}
                                        disabled={newUserName === ''}
                                    >
                                        Ajouter
                                    </CustomButton>

                                    <CustomButton onClick={() => clearAllFields()}>Annuler</CustomButton>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export async function getServerSideProps(context: NextPageContext) {
    const { query } = context;

    const groupId = query.id?.toString() ?? '';

    if (Number.isNaN(groupId)) {
        return {
            notFound: true
        };
    }

    const group = await getGroupById(groupId);
    const groupUsers = await getUsersFromGroupId(groupId);

    return {
        props: {
            group: {
                ...group,
                updatedAt: group?.updatedAt?.toISOString() ?? '',
                createdAt: group?.createdAt?.toISOString() ?? ''
            },
            groupUsers: groupUsers.map((groupUser) => ({
                ...groupUser,
                updatedAt: groupUser.updatedAt?.toISOString() ?? '',
                createdAt: groupUser.createdAt?.toISOString() ?? ''
            }))
        }
    };
}

export default GroupComponent;

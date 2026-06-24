import { useState } from 'react';
import { Layout } from '@/components/layout';
import { EHeader } from '@/components/customHeader';
import { NextPageContext } from 'next';
import CustomButton from '@/components/atoms/customButton';
import { TUserApiResult } from '@/pages/api/user';
import { getGroupById, ensureGroupInviteToken } from '@/lib/db/groupManager';
import { getUsersFromGroupId } from '@/lib/db/userManager';
import { User, Group } from '@prisma/client';
import Router from 'next/router';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import Swal from 'sweetalert2';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';

const GroupComponent = ({ group, groupUsers = [], inviteToken }: { group: Group; groupUsers: User[]; inviteToken: string }): JSX.Element => {
    const { connectedUser } = useCurrentUser();

    const [localUsers, setLocalUsers] = useState<User[]>(groupUsers);
    const [copiedInvite, setCopiedInvite] = useState(false);

    const inviteUrl = typeof window !== 'undefined' ? `${window.location.origin}/join/${inviteToken}` : `/join/${inviteToken}`;

    const shareInviteLink = async () => {
        const shareData = {
            title: `Rejoins le groupe ${group.name}`,
            text: `Clique pour rejoindre la liste de cadeaux du groupe "${group.name}" !`,
            url: inviteUrl
        };
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch {
                // annulé par l'utilisateur, on ne fait rien
                return;
            }
        }
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopiedInvite(true);
            setTimeout(() => setCopiedInvite(false), 2000);
        } catch {
            // ignore
        }
    };

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
                    const apiResult = await AxiosWrapper.delete(`/api/user/${userId}`);
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
                            text: data?.error || 'Impossible de supprimer cet utilisateur. Réessayez dans quelques instants.',
                            icon: 'error'
                        });
                    }
                }
            });
    };

    const addUser = async (): Promise<void> => {
        const { value: name } = await Swal.fire({
            title: 'Ajouter un utilisateur',
            input: 'text',
            inputPlaceholder: 'Prénom',
            showCancelButton: true,
            confirmButtonText: 'Ajouter',
            cancelButtonText: 'Annuler',
        });
        if (!name) return;

        const response = await AxiosWrapper.post('/api/user', {
            user: { id: '', name: name.trim(), isAdmin: false, acceptSuggestedGift: false, updatedAt: new Date(), createdAt: new Date() },
            initiatorUserId: connectedUser?.userId ?? '',
            groupId: group.id
        });
        const data = response?.data as TUserApiResult;

        if (data?.success === true && data?.user) {
            setLocalUsers((users) => [...users, data.user!]);
            Swal.fire({ title: 'Utilisateur ajouté !', icon: 'success', timer: 1500, showConfirmButton: false });
        } else {
            Swal.fire({ title: 'Erreur', text: data?.error || 'Impossible de créer cet utilisateur. Réessayez dans quelques instants.', icon: 'error' });
        }
    };

    const renameUser = async (user: User): Promise<void> => {
        const { value: newName } = await Swal.fire({
            title: `Renommer ${user.name}`,
            input: 'text',
            inputValue: user.name,
            showCancelButton: true,
            confirmButtonText: 'Renommer',
            cancelButtonText: 'Annuler',
        });
        if (!newName || newName.trim() === user.name) return;

        const response = await AxiosWrapper.patch(`/api/user/${user.id}`, {
            user: { name: newName.trim() },
            groupId: group.id
        });
        const data = response?.data as TUserApiResult;

        if (data?.success && data.user) {
            setLocalUsers((users) => users.map((u) => (u.id === user.id ? { ...u, name: data.user!.name } : u)));
            Swal.fire({ title: 'Renommé !', icon: 'success', timer: 1500, showConfirmButton: false });
        } else {
            Swal.fire({ title: 'Erreur', text: data?.error || 'Impossible de renommer.', icon: 'error' });
        }
    };

    return (
        <Layout selectedHeader={EHeader.Group}>
            <div>
                <div className="mb-8">
                    <p className="text-sm text-gray-500 mb-1">Gestion du groupe</p>
                    <h1 className="text-2xl font-bold text-gray-800">{group.name}</h1>
                </div>

                <div className="flex justify-end mb-4">
                    <button
                        onClick={shareInviteLink}
                        className="text-sm transition-colors flex items-center gap-1"
                    >
                        {copiedInvite ? '✓ Lien copié !' : '🔗 Inviter des proches'}
                    </button>
                </div>

                {localUsers.map((user) => (
                    <div className="item" key={`group_${user.id}`}>
                        <div className="flex justify-between items-center">
                            <span className="w-full md:w-auto">
                                <b className="pr-2">Nom:</b>
                                <span>{user.name}</span>
                            </span>

                            <div className="block md:flex items-center text-center">
                                <CustomButton
                                    className="slate-button mt-3 md:mt-0"
                                    onClick={() => Router.push(`/giftList/${user.id}`)}
                                >
                                    Liste de cadeaux
                                </CustomButton>

                                {connectedUser?.isAdmin && (
                                    <div className="md:flex">
                                        <CustomButton
                                            className="green-button mt-3 md:mt-0"
                                            onClick={() => renameUser(user)}
                                        >
                                            Modifier
                                        </CustomButton>

                                        <CustomButton className="mt-3 md:mt-0" onClick={() => removeUser(user.id)}>
                                            Supprimer
                                        </CustomButton>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                ))}

                {connectedUser?.isAdmin && (
                    <CustomButton className="green-button" onClick={addUser}>
                        Ajouter un utilisateur
                    </CustomButton>
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

    if (!group) {
        return { notFound: true };
    }

    const groupUsers = await getUsersFromGroupId(groupId);
    const inviteToken = await ensureGroupInviteToken(groupId);

    return {
        props: {
            group: (({ updatedAt, createdAt, ...g }) => g)(group),
            groupUsers: groupUsers.map(({ updatedAt, createdAt, ...u }) => u),
            inviteToken
        }
    };
}

export default GroupComponent;

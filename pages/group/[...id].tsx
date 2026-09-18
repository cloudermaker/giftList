import { useState } from 'react';
import { Layout } from '@/components/layout';
import { PageTitle } from '@/components/atoms/PageTitle';
import { EHeader } from '@/components/customHeader';
import { NextPageContext } from 'next';
import CustomButton from '@/components/atoms/customButton';
import { TUserApiResult } from '@/pages/api/user';
import { getGroupById, ensureGroupInviteToken } from '@/lib/db/groupManager';
import { getUsersFromGroupId } from '@/lib/db/userManager';
import { User, Group } from '@prisma/client';
import Router from 'next/router';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { toast, alertError, confirmDestructive, promptText, getSwal } from '@/lib/ui/alert';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';

const GroupComponent = ({
    group,
    groupUsers = [],
    inviteToken
}: {
    group: Group;
    groupUsers: User[];
    inviteToken: string;
}): JSX.Element => {
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
        const confirmed = await confirmDestructive({
            title: 'Es-tu certain de vouloir supprimer cet utilisateur?',
            text: 'Il ne sera pas possible de revenir en arrière!'
        });
        if (!confirmed) return;

        const apiResult = await AxiosWrapper.delete(`/api/user/${userId}`);
        const data = apiResult?.data as TUserApiResult;

        if (data?.success === true) {
            setLocalUsers(localUsers.filter((user) => user.id !== userId));
            (await getSwal()).fire({ title: 'Supprimé!', text: "L'utilisateur a été supprimé.", icon: 'success' });
        } else {
            alertError('Erreur', data?.error || 'Impossible de supprimer cet utilisateur. Réessayez dans quelques instants.');
        }
    };

    const addUser = async (): Promise<void> => {
        const name = await promptText({ title: 'Ajouter un utilisateur', placeholder: 'Prénom', confirmText: 'Ajouter' });
        if (!name) return;

        const response = await AxiosWrapper.post('/api/user', {
            user: {
                id: '',
                name: name.trim(),
                isAdmin: false,
                acceptSuggestedGift: false,
                updatedAt: new Date(),
                createdAt: new Date()
            },
            initiatorUserId: connectedUser?.userId ?? '',
            groupId: group.id
        });
        const data = response?.data as TUserApiResult;

        if (data?.success === true && data?.user) {
            setLocalUsers((users) => [...users, data.user!]);
            toast('Utilisateur ajouté !');
        } else {
            alertError('Erreur', data?.error || 'Impossible de créer cet utilisateur. Réessayez dans quelques instants.');
        }
    };

    const renameUser = async (user: User): Promise<void> => {
        const newName = await promptText({ title: `Renommer ${user.name}`, initialValue: user.name, confirmText: 'Renommer' });
        if (!newName || newName.trim() === user.name) return;

        const response = await AxiosWrapper.patch(`/api/user/${user.id}`, {
            user: { name: newName.trim() },
            groupId: group.id
        });
        const data = response?.data as TUserApiResult;

        if (data?.success && data.user) {
            setLocalUsers((users) => users.map((u) => (u.id === user.id ? { ...u, name: data.user!.name } : u)));
            toast('Renommé !');
        } else {
            alertError('Erreur', data?.error || 'Impossible de renommer.');
        }
    };

    return (
        <Layout selectedHeader={EHeader.Group}>
            <div>
                <PageTitle eyebrow="Gestion du groupe">{group.name}</PageTitle>

                <div className="flex justify-end mb-4">
                    <CustomButton className="slate-button" onClick={shareInviteLink}>
                        {copiedInvite ? '✓ Lien copié !' : 'Inviter des proches'}
                    </CustomButton>
                </div>

                {localUsers.map((user) => (
                    <div className="item" key={`group_${user.id}`}>
                        <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-gray-800 flex-1 min-w-0 truncate">{user.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                                <CustomButton className="slate-button" onClick={() => Router.push(`/giftList/${user.id}`)}>
                                    <span>🎁</span>
                                    <span className="hidden sm:inline ml-1">Liste</span>
                                </CustomButton>
                                {connectedUser?.isAdmin && (
                                    <>
                                        <CustomButton className="green-button" onClick={() => renameUser(user)}>
                                            <span>✏️</span>
                                            <span className="hidden sm:inline ml-1">Modifier</span>
                                        </CustomButton>
                                        <CustomButton onClick={() => removeUser(user.id)}>
                                            <span>🗑️</span>
                                            <span className="hidden sm:inline ml-1">Supprimer</span>
                                        </CustomButton>
                                    </>
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

    const [group, groupUsers] = await Promise.all([getGroupById(groupId), getUsersFromGroupId(groupId)]);

    if (!group) {
        return { notFound: true };
    }

    const inviteToken = group.inviteToken ?? (await ensureGroupInviteToken(groupId));

    return {
        props: {
            group: (({ updatedAt, createdAt, adminPassword, ...g }) => g)(group),
            groupUsers: groupUsers.map(({ updatedAt, createdAt, ...u }) => u),
            inviteToken
        }
    };
}

export default GroupComponent;

import { EHeader } from '@/components/customHeader';
import { Layout } from '@/components/layout';
import SEO from '@/components/SEO';
import { useEffect, useState } from 'react';
import { Group } from '@prisma/client';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import CustomButton from '@/components/atoms/customButton';
import Swal from 'sweetalert2';
import GiftIdeasGenerator from '@/components/GiftIdeasGenerator';
import Router from 'next/router';
import { OnboardingModal } from '@/components/OnboardingModal';

type TMember = { id: string; name: string; isAdmin: boolean };

const AVATAR_COLORS = [
    { bg: '#fde8e6', text: '#c0392b' },
    { bg: '#e8f2ec', text: '#4a7c59' },
    { bg: '#e8edf5', text: '#4a6fa5' },
    { bg: '#fef3cd', text: '#b8860b' },
    { bg: '#f0ebf8', text: '#7b5ea7' },
    { bg: '#e6f3f5', text: '#2e7d8a' },
];

export const Home = (): JSX.Element => {
    const { connectedUser } = useCurrentUser();
    const [group, setGroup] = useState<Group>();
    const [members, setMembers] = useState<TMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (!connectedUser?.groupId) return;
        Promise.all([
            AxiosWrapper.get(`/api/group/${connectedUser.groupId}`),
            AxiosWrapper.get(`/api/user?groupid=${connectedUser.groupId}`),
        ]).then(([groupRes, usersRes]) => {
            const groupData = groupRes?.data as { success: boolean; group?: Group };
            if (groupData?.success && groupData.group) {
                setGroup(groupData.group);
    }
            const users = usersRes?.data?.users ?? [];
            setMembers(users);
            if (users.length === 1 && connectedUser?.isAdmin) setShowOnboarding(true);
        }).finally(() => setLoading(false));
    }, [connectedUser]);

    const shareInviteLink = async () => {
        if (!group?.inviteToken) return;
        const url = `${window.location.origin}/join/${group.inviteToken}`;
        const shareData = {
            title: `Rejoins le groupe ${group.name}`,
            text: `Clique pour rejoindre la liste de cadeaux du groupe "${group.name}" !`,
            url,
        };
        if (navigator.share) {
            try { await navigator.share(shareData); return; } catch {}
        }
        await navigator.clipboard.writeText(url);
        Swal.fire({ title: 'Lien copié !', icon: 'success', timer: 1500, showConfirmButton: false });
    };

    const addMember = async () => {
        const { value: name } = await Swal.fire({
            title: 'Ajouter un membre',
            input: 'text',
            inputPlaceholder: 'Prénom',
            showCancelButton: true,
            confirmButtonText: 'Ajouter',
            cancelButtonText: 'Annuler',
        });
        if (!name) return;
        const result = await AxiosWrapper.post('/api/user', { user: { name }, groupId: group?.id });
        const data = result?.data;
        if (data?.success && data.user) {
            setMembers((m) => [...m, { id: data.user.id, name: data.user.name, isAdmin: false }]);
            Swal.fire({ title: 'Membre ajouté !', icon: 'success', timer: 1500, showConfirmButton: false });
        } else {
            Swal.fire('Erreur', data?.error || "Impossible d'ajouter le membre.", 'error');
        }
    };


    return (
        <Layout selectedHeader={EHeader.Homepage}>
            <SEO
                title="Mon groupe de cadeaux"
                description="Gérez votre liste de cadeaux en famille ou entre amis."
                noIndex={true}
            />
            <div>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
                    <div>
                        <p className="text-sm text-gray-500">Bonjour, {connectedUser?.userName}</p>
                        {loading
                            ? <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mt-1" />
                            : <h1 className="text-2xl font-bold text-gray-800">{group?.name}</h1>
                        }
                    </div>
                    {group?.inviteToken && (
                        <CustomButton className="slate-button shrink-0" onClick={shareInviteLink}>
                            Inviter quelqu&apos;un
                        </CustomButton>
                    )}
                </div>

                {/* Member cards */}
                <h2 className="text-base font-semibold text-gray-600 uppercase tracking-wide mb-4">Listes de cadeaux</h2>
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-sm p-5 animate-pulse">
                                <div className="h-5 bg-gray-200 rounded w-2/3 mb-4" />
                                <div className="h-8 bg-gray-100 rounded" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
                        {members.slice(0, 5).map((member) => {
                            const isMe = member.id === connectedUser?.userId;
                            const avatarColor = AVATAR_COLORS[member.name.charCodeAt(0) % AVATAR_COLORS.length];
                            return (
                                <div
                                    key={member.id}
                                    onClick={() => Router.push(`/giftList/${member.id}`)}
                                    className={`bg-white rounded-xl shadow-sm p-5 flex flex-col gap-3 border-2 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${isMe ? 'border-rose-200' : 'border-transparent hover:border-gray-100'}`}
                                >
                                    <div
                                        className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold"
                                        style={{ background: avatarColor.bg, color: avatarColor.text }}
                                    >
                                        {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800 truncate">{member.name}</p>
                                        <div className="flex gap-2 mt-0.5">
                                            {isMe && <span className="text-xs text-gray-400">Vous</span>}
                                            {member.isAdmin && <span className="text-xs text-rose-400">Admin</span>}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400">Voir les cadeaux →</p>
                                </div>
                            );
                        })}
                        {members.length > 5 && (
                            <div
                                onClick={() => Router.push(`/group/${group?.id}`)}
                                className="bg-white rounded-xl shadow-sm p-5 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
                            >
                                <span className="text-2xl text-gray-300">+{members.length - 5}</span>
                                <p className="text-sm text-gray-400">Voir tous les membres</p>
                            </div>
                        )}
                    </div>
                )}
                {!loading && connectedUser?.isAdmin && (
                    <div className="mb-10 -mt-6">
                        <CustomButton className="green-button" onClick={addMember}>Ajouter un membre</CustomButton>
                    </div>
                )}


                {/* Gift Ideas Generator */}
                <GiftIdeasGenerator />
            </div>

            {showOnboarding && group?.inviteToken && (
                <OnboardingModal
                    userName={connectedUser?.userName ?? ''}
                    groupName={group.name}
                    inviteToken={group.inviteToken}
                    onClose={() => setShowOnboarding(false)}
                />
            )}
        </Layout>
    );
};

export default Home;

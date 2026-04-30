import { ReactNode, Suspense, useEffect, useState } from 'react';
import { Layout } from '@/components/layout';
import { EHeader } from '@/components/customHeader';
import ModernLink from '@/components/atoms/ModernLink';
import { NextPageContext } from 'next';
import CustomButton from '@/components/atoms/customButton';
import GiftForm from '@/components/atoms/GiftForm';
import { Medal } from '@/components/icons/medal';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Drag } from '@/components/icons/drag';
import { Gift, User } from '@prisma/client';
import { buildDefaultGift, getGiftsFromUserId, GiftWithTakenUserId } from '@/lib/db/giftManager';
import { TGiftApiResult } from '@/pages/api/gift';
import { getUserById } from '@/lib/db/userManager';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import Swal from 'sweetalert2';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import { cloneDeep } from 'lodash';
import { TUserApiResult } from '../api/user';
import SubGiftList from '@/components/SubGiftList';

const NEW_GIFT_SENTINEL = 'new';

function SortableItem({
    gift, children, idx, canReorder
}: {
    gift: GiftWithTakenUserId; children: ReactNode; idx: number; canReorder: boolean;
}) {
    const { listeners, setNodeRef, transform } = useSortable({ id: gift.id });
    const style = { transform: CSS.Transform.toString(transform) };
    const color = idx === 1 ? 'orange' : idx === 2 ? 'silver' : 'brown';
    const localListeners = canReorder ? listeners : null;
    const localStyle = canReorder ? { cursor: 'grab', touchAction: 'none' } : {};

    const LeftIcon = (): JSX.Element => {
        if (idx <= 3) return <Medal className="pr-3 w-9" color={color} />;
        if (canReorder) return <Drag className="pr-3 w-9" />;
        return <div className="pr-3 w-9" />;
    };

    return (
        <div className="item flex items-center" ref={setNodeRef} style={style}>
            <div {...localListeners} style={localStyle}><LeftIcon /></div>
            {children}
        </div>
    );
}

const GiftPage = ({ user, giftList = [] }: { user: User; giftList: GiftWithTakenUserId[] }): JSX.Element => {
    const { connectedUser } = useCurrentUser();

    const isOwnList = user.id === connectedUser?.userId;
    const userCanAddGift = isOwnList || connectedUser?.isAdmin === true;

    const [localGifts, setLocalGifts] = useState<GiftWithTakenUserId[]>(giftList);
    const [filteringTakenGifts, setFilteringTakenGifts] = useState(false);

    // selectedGiftId: gift id | 'new' (création) | null (fermé)
    const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
    // editingGiftId: id du cadeau en cours d'édition dans la modal
    const [editingGiftId, setEditingGiftId] = useState<string>('');

    // État partagé du formulaire (création + édition)
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formLink, setFormLink] = useState('');
    const [formType, setFormType] = useState<'SIMPLE' | 'MULTIPLE'>('SIMPLE');

    const [groupUserMap, setGroupUserMap] = useState<{ [key: string]: User }>({});
    const [loadingGroupUsers, setLoadingGroupUsers] = useState(true);
    const [takingGiftId, setTakingGiftId] = useState<string | null>(null);

    // Resync à la navigation vers une autre liste
    useEffect(() => {
        setLocalGifts(giftList);
        closeModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.id]);

    // Fermer avec Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const load = async () => {
            if (!connectedUser?.groupId) return;
            setLoadingGroupUsers(true);
            try {
                const res = await AxiosWrapper.get(`/api/user?groupid=${connectedUser.groupId}`);
                if (res?.status !== 200) return;
                const users = (res?.data as TUserApiResult).users as User[];
                setGroupUserMap(Object.fromEntries(users.map((u) => [u.id, u])));
            } catch { /* silently fail */ } finally {
                setLoadingGroupUsers(false);
            }
        };
        load();
    }, [connectedUser?.groupId]);

    const clearForm = () => {
        setFormName(''); setFormDescription(''); setFormLink(''); setFormType('SIMPLE'); setEditingGiftId('');
    };

    const closeModal = () => { clearForm(); setSelectedGiftId(null); };
    const openCreateModal = () => { clearForm(); setSelectedGiftId(NEW_GIFT_SENTINEL); };

    const startEditing = (gift: Gift) => {
        setFormName(gift.name);
        setFormDescription(gift.description ?? '');
        setFormLink(gift.url ?? '');
        setFormType((gift.giftType as 'SIMPLE' | 'MULTIPLE') ?? 'SIMPLE');
        setEditingGiftId(gift.id);
    };

    const removeGift = async (giftId: string) => {
        const swal = Swal.mixin({ buttonsStyling: true });
        swal.fire({
            title: 'Es-tu certain de vouloir supprimer ce cadeau ?',
            text: 'Il ne sera pas possible de revenir en arrière!',
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Oui!', cancelButtonText: 'Non!', reverseButtons: true
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const res = await AxiosWrapper.delete(`/api/gift/${giftId}`);
                const data = res?.data as TGiftApiResult;
                if (data?.success) {
                    setLocalGifts((prev) => prev.filter((g) => g.id !== giftId));
                    closeModal();
                    swal.fire({ title: 'Supprimé!', text: 'Le cadeau a été supprimé.', icon: 'success' });
                } else {
                    swal.fire({ title: 'Erreur', text: data?.error || 'Impossible de supprimer ce cadeau.', icon: 'error' });
                }
            } catch (err: any) {
                swal.fire({ title: 'Erreur', text: err?.response?.data?.error || err?.message || 'Impossible de supprimer.', icon: 'error' });
            }
        });
    };

    const saveGift = async (giftId: string | null = null) => {
        const currentGift: GiftWithTakenUserId = cloneDeep(localGifts.find((g) => g.id === giftId)!);
        const giftToSave: GiftWithTakenUserId = currentGift ?? buildDefaultGift(user.id, localGifts.length);
        giftToSave.name = formName;
        giftToSave.description = formDescription;
        giftToSave.url = formLink;
        giftToSave.giftType = formType;

        try {
            if (giftId) {
                const res = await AxiosWrapper.patch(`/api/gift/${giftId}`, { gift: giftToSave });
                const data = res?.data as TGiftApiResult;
                if (data?.success && data.gift) {
                    const updated: GiftWithTakenUserId = { ...data.gift, takenUserId: (data.gift as any).takenUserId ?? null };
                    setLocalGifts((prev) => prev.map((g) => g.id === giftId ? updated : g));
                } else {
                    Swal.fire({ title: 'Erreur', text: data?.error || 'Impossible de modifier ce cadeau.', icon: 'error' }); return;
                }
            } else {
                const res = await AxiosWrapper.post('/api/gift', { gift: giftToSave, initiatorUserId: connectedUser?.userId, userGiftId: user.id });
                const data = res?.data as TGiftApiResult;
                if (data?.success && data.gift) {
                    const created: GiftWithTakenUserId = { ...data.gift, takenUserId: (data.gift as any).takenUserId ?? null };
                    setLocalGifts((prev) => [...prev, created]);
                } else {
                    Swal.fire({ title: 'Erreur', text: data?.error || "Impossible d'ajouter ce cadeau.", icon: 'error' }); return;
                }
            }
        } catch (err: any) {
            Swal.fire({ title: 'Erreur', text: err?.response?.data?.error || err?.message || 'Impossible de sauvegarder.', icon: 'error' }); return;
        }
        closeModal();
    };

    const onBlockUnBlockGiftClick = async (giftToUpdate: GiftWithTakenUserId) => {
        const isTaken = giftToUpdate.takenUserId != null;
        setTakingGiftId(giftToUpdate.id);
        try {
            const res = isTaken
                ? await AxiosWrapper.delete(`/api/gift/${giftToUpdate.id}/take`, { userId: connectedUser?.userId })
                : await AxiosWrapper.post(`/api/gift/${giftToUpdate.id}/take`, { userId: connectedUser?.userId });
            if (res?.data?.success) {
                const refreshRes = await AxiosWrapper.get(`/api/gift?giftId=${giftToUpdate.id}`);
                const refreshData = refreshRes?.data as TGiftApiResult;
                if (refreshData?.success && refreshData.gift) {
                    const updated: GiftWithTakenUserId = { ...refreshData.gift, takenUserId: (refreshData.gift as any).takenUserId ?? null };
                    setLocalGifts((prev) => prev.map((g) => g.id === giftToUpdate.id ? updated : g));
                }
            } else {
                Swal.fire({ title: 'Erreur', text: res?.data?.error || 'Impossible de réserver ce cadeau.', icon: 'error' });
            }
        } catch (err) {
            Swal.fire({ title: 'Erreur', text: `Erreur lors de la réservation: ${err}`, icon: 'error' });
        } finally {
            setTakingGiftId(null);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = (event: { active: any; over: any }) => {
        const { active, over } = event;
        if (active.id === over.id) return;
        setLocalGifts((prev) => {
            const oldIndex = prev.findIndex((g) => g.id === active.id);
            const newIndex = prev.findIndex((g) => g.id === over.id);
            const reordered = arrayMove(prev, oldIndex, newIndex).map((g, i) => ({ ...g, order: i + 1 }));
            AxiosWrapper.post('/api/gift', { gifts: reordered, initiatorUserId: connectedUser?.userId, userGiftId: user.id })
                .catch((err) => console.error('Erreur mise à jour ordre:', err));
            return reordered;
        });
    };

    const isCreating = selectedGiftId === NEW_GIFT_SENTINEL;
    const selectedGift = isCreating ? null : (localGifts.find((g) => g.id === selectedGiftId) ?? null);
    const isEditing = !!editingGiftId && editingGiftId === selectedGift?.id;
    const modalOpen = selectedGiftId !== null;

    const pageTitle = isOwnList ? 'Ma liste de cadeaux' : `Liste de cadeaux de ${user.name}`;

    return (
        <Layout selectedHeader={EHeader.GiftList} pageTitle={pageTitle}>
            <div className="mb-10">
                <h1>{`Voici la liste de cadeaux pour ${user.name}:`}</h1>

                {!isOwnList && (
                    <div className="flex pb-4">
                        Je veux cacher les cadeaux déja pris:
                        <input
                            className="ml-2 cursor-pointer w-6 accent-vertNoel"
                            type="checkbox"
                            onChange={() => setFilteringTakenGifts((v) => !v)}
                        />
                    </div>
                )}

                <Suspense fallback="loading...">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={localGifts}>
                            {localGifts
                                .filter((gift) => !filteringTakenGifts || !gift.takenUserId)
                                .map((gift, idx) => (
                                    <SortableItem key={`gift_${gift.id}`} gift={gift} idx={idx + 1} canReorder={userCanAddGift}>
                                        <div
                                            className={`w-full cursor-pointer p-3 rounded-lg border flex justify-between items-start gap-3 ${
                                                !isOwnList && gift.takenUserId ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                                            }`}
                                            onClick={() => setSelectedGiftId(gift.id)}
                                        >
                                            <span className={`font-medium flex-1 min-w-0 ${!isOwnList && gift.takenUserId ? 'line-through text-gray-400' : ''}`}>
                                                {gift.name}
                                            </span>
                                            {gift.giftType === 'MULTIPLE' && (
                                                <span className="shrink-0 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                                                    🧩 {gift.subGiftsCount ?? 0} élément{(gift.subGiftsCount ?? 0) !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {!isOwnList && gift.giftType !== 'MULTIPLE' && (
                                                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                                                    gift.takenUserId ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {gift.takenUserId ? 'Pris' : 'Libre'}
                                                </span>
                                            )}
                                        </div>
                                    </SortableItem>
                                ))}
                        </SortableContext>
                    </DndContext>
                </Suspense>

                {userCanAddGift && (
                    <CustomButton className="green-button" onClick={openCreateModal}>
                        Ajouter un cadeau
                    </CustomButton>
                )}

                {/* Modal : création ou détail/édition */}
                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                        <div className="relative bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl shadow-xl max-h-[90vh] flex flex-col">

                            {/* Header */}
                            <div className="flex items-start justify-between px-5 py-4 border-b gap-3">
                                <h2 className="font-bold text-lg leading-snug">
                                    {isCreating ? 'Nouveau cadeau' : selectedGift!.name}
                                </h2>
                                <div onClick={closeModal} className="shrink-0 text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer mt-0.5">
                                    ✕
                                </div>
                            </div>

                            {/* Body */}
                            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                                {isCreating || isEditing ? (
                                    <GiftForm
                                        formName={formName} setFormName={setFormName}
                                        formDescription={formDescription} setFormDescription={setFormDescription}
                                        formLink={formLink} setFormLink={setFormLink}
                                        formType={formType} setFormType={setFormType}
                                        autoFocusName
                                    />
                                ) : (
                                    <>
                                        {selectedGift!.description
                                            ? <p className="text-gray-700">{selectedGift!.description}</p>
                                            : <p className="text-gray-700 italic">Pas de description</p>
                                        }
                                        {selectedGift!.url
                                            ? <p><ModernLink href={selectedGift!.url} /></p>
                                            : <p className="text-gray-700 italic">Pas de lien</p>
                                        }
                                        {!isOwnList && selectedGift!.takenUserId && selectedGift!.takenUserId !== connectedUser?.userId && (
                                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                                Ce cadeau est déjà pris
                                                {!loadingGroupUsers && groupUserMap[selectedGift!.takenUserId] && (
                                                    <> — par <b>{groupUserMap[selectedGift!.takenUserId]?.name}</b></>
                                                )}
                                            </div>
                                        )}
                                        {connectedUser?.isAdmin && (
                                            <i className="text-xs text-gray-400 block space-y-0.5">
                                                <div>Créé : {selectedGift!.createdAt?.toLocaleString()}</div>
                                                <div>Mis à jour : {selectedGift!.updatedAt?.toString()}</div>
                                            </i>
                                        )}
                                        {selectedGift!.giftType === 'MULTIPLE' && (
                                            <SubGiftList
                                                parentGift={selectedGift!}
                                                userId={connectedUser?.userId}
                                                isAdmin={connectedUser?.isAdmin}
                                                initialCount={selectedGift!.subGiftsCount}
                                                onGiftUpdate={() => {
                                                    AxiosWrapper.get(`/api/gift?giftId=${selectedGift!.id}`).then((res) => {
                                                        const data = res?.data as TGiftApiResult;
                                                        if (data?.success && data.gift) {
                                                            const updated: GiftWithTakenUserId = { ...data.gift, takenUserId: (data.gift as any).takenUserId ?? null };
                                                            setLocalGifts((prev) => prev.map((g) => g.id === selectedGift!.id ? updated : g));
                                                        }
                                                    });
                                                }}
                                            />
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="border-t px-5 py-4 flex flex-wrap gap-2 justify-end">
                                {isCreating && (
                                    <CustomButton className="green-button" onClick={() => saveGift(null)} disabled={!formName}>
                                        Créer
                                    </CustomButton>
                                )}
                                {!isCreating && userCanAddGift && (
                                    isEditing ? (
                                        <>
                                            <CustomButton className="green-button" onClick={() => saveGift(selectedGift!.id)} disabled={!formName}>
                                                Valider
                                            </CustomButton>
                                            <CustomButton onClick={clearForm}>Annuler</CustomButton>
                                        </>
                                    ) : (
                                        <>
                                            <CustomButton className="green-button" onClick={() => startEditing(selectedGift!)}>
                                                Modifier
                                            </CustomButton>
                                            <CustomButton onClick={() => removeGift(selectedGift!.id)}>
                                                Supprimer
                                            </CustomButton>
                                        </>
                                    )
                                )}
                                {!isCreating && !userCanAddGift && selectedGift!.giftType !== 'MULTIPLE' && selectedGift!.takenUserId === connectedUser?.userId && (
                                    <CustomButton onClick={() => onBlockUnBlockGiftClick(selectedGift!)} disabled={takingGiftId === selectedGift!.id}>
                                        {takingGiftId === selectedGift!.id ? 'Libération...' : 'Je ne prends plus ce cadeau'}
                                    </CustomButton>
                                )}
                                {!isCreating && !userCanAddGift && selectedGift!.giftType !== 'MULTIPLE' && !selectedGift!.takenUserId && (
                                    <CustomButton className="green-button" onClick={() => onBlockUnBlockGiftClick(selectedGift!)} disabled={takingGiftId === selectedGift!.id}>
                                        {takingGiftId === selectedGift!.id ? 'Réservation...' : 'Je prends ce cadeau'}
                                    </CustomButton>
                                )}
                                <CustomButton onClick={closeModal}>Fermer</CustomButton>
                            </div>
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

    if (Number.isNaN(userId)) return { notFound: true };

    const user = await getUserById(userId);
    const giftList = await getGiftsFromUserId(userId);

    return {
        props: {
            user: {
                ...user,
                updatedAt: user?.updatedAt?.toISOString() ?? '',
                createdAt: user?.createdAt?.toISOString() ?? ''
            },
            giftList: giftList.map((gift) => ({
                ...gift,
                updatedAt: gift.updatedAt?.toISOString() ?? '',
                createdAt: gift.createdAt?.toISOString() ?? ''
            }))
        }
    };
}

export default GiftPage;

import { ReactNode, Suspense, useCallback, useEffect, useState } from 'react';
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
import { Gift, GiftType, User } from '@prisma/client';
import { buildDefaultGift, getGiftsFromUserId, GiftWithTakenUserId } from '@/lib/db/giftManager';
import { TGiftApiResult } from '@/pages/api/gift';
import { getUserById } from '@/lib/db/userManager';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import Swal from 'sweetalert2';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import { cloneDeep } from 'lodash';
import { TUserApiResult } from '../api/user';
import SubGiftList from '@/components/SubGiftList';
import UnlimitedGiftTakers from '@/components/UnlimitedGiftTakers';

const NEW_GIFT_SENTINEL = 'new';

function SortableItem({
    gift, children, idx, canReorder, viewMode = 'list'
}: {
    gift: GiftWithTakenUserId; children: ReactNode; idx: number; canReorder: boolean; viewMode?: 'list' | 'grid';
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
            {viewMode === 'list' && <div {...localListeners} style={localStyle}><LeftIcon /></div>}
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
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(() =>
        (typeof window !== 'undefined' ? localStorage.getItem('giftListViewMode') : null) as 'list' | 'grid' ?? 'list'
    );

    // selectedGiftId: gift id | 'new' (création) | null (fermé)
    const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null);
    // editingGiftId: id du cadeau en cours d'édition dans la modal
    const [editingGiftId, setEditingGiftId] = useState<string>('');

    // État partagé du formulaire (création + édition)
    const [formName, setFormName] = useState('');
    const [formDescription, setFormDescription] = useState('');
    const [formLink, setFormLink] = useState('');
    const [formType, setFormType] = useState<'SIMPLE' | 'MULTIPLE' | 'UNLIMITED'>('SIMPLE');

    const [groupUserMap, setGroupUserMap] = useState<{ [key: string]: User }>({});
    const [loadingGroupUsers, setLoadingGroupUsers] = useState(true);
    const [takingGiftId, setTakingGiftId] = useState<string | null>(null);

    const clearForm = useCallback(() => {
        setFormName(''); setFormDescription(''); setFormLink(''); setFormType('SIMPLE'); setEditingGiftId('');
    }, []);

    const closeModal = useCallback(() => { clearForm(); setSelectedGiftId(null); }, [clearForm]);
    const openCreateModal = () => { clearForm(); setSelectedGiftId(NEW_GIFT_SENTINEL); };

    // Resync à la navigation vers une autre liste
    useEffect(() => {
        setLocalGifts(giftList);
        closeModal();
    }, [user.id, giftList, closeModal]);

    // Fermer avec Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [closeModal]);

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

    const startEditing = (gift: Gift) => {
        setFormName(gift.name);
        setFormDescription(gift.description ?? '');
        setFormLink(gift.url ?? '');
        setFormType((gift.giftType as 'SIMPLE' | 'MULTIPLE' | 'UNLIMITED') ?? 'SIMPLE');
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
                    swal.fire({ title: 'Supprimé !', icon: 'success', timer: 1500, showConfirmButton: false });
                } else {
                    swal.fire({ title: 'Erreur', text: 'Impossible de supprimer ce cadeau.', icon: 'error' });
                }
            } catch (err: any) {
                swal.fire({ title: 'Erreur', text: 'Impossible de supprimer.', icon: 'error' });
            }
        });
    };

    const saveGift = async (giftId: string | null = null) => {
        const currentGift: GiftWithTakenUserId = cloneDeep(localGifts.find((g) => g.id === giftId)!);

        if (giftId && currentGift?.giftType === 'MULTIPLE' && formType === 'SIMPLE' && (currentGift.subGiftsCount ?? 0) > 0) {
            Swal.fire({
                title: 'Impossible de convertir ce cadeau',
                text: `Ce cadeau contient ${currentGift.subGiftsCount} sous-élément${(currentGift.subGiftsCount ?? 0) > 1 ? 's' : ''}. Supprime-les d'abord avant de le convertir en cadeau simple.`,
                icon: 'warning'
            });
            return;
        }

        const giftToSave: GiftWithTakenUserId = currentGift ?? buildDefaultGift(user.id, localGifts.length);
        giftToSave.name = formName;
        giftToSave.description = formDescription;
        giftToSave.url = formLink;
        giftToSave.giftType = formType as any;

        try {
            if (giftId) {
                const res = await AxiosWrapper.patch(`/api/gift/${giftId}`, { gift: giftToSave });
                const data = res?.data as TGiftApiResult;
                if (data?.success && data.gift) {
                    const updated: GiftWithTakenUserId = { ...data.gift, takenUserId: (data.gift as any).takenUserId ?? null };
                    setLocalGifts((prev) => prev.map((g) => g.id === giftId ? updated : g));
                    Swal.fire({ title: 'Cadeau modifié !', icon: 'success', timer: 1500, showConfirmButton: false });
                } else {
                    Swal.fire({ title: 'Erreur', text: 'Impossible de modifier ce cadeau.', icon: 'error' }); return;
                }
            } else {
                const res = await AxiosWrapper.post('/api/gift', { gift: giftToSave, initiatorUserId: connectedUser?.userId, userGiftId: user.id });
                const data = res?.data as TGiftApiResult;
                if (data?.success && data.gift) {
                    const created: GiftWithTakenUserId = { ...data.gift, takenUserId: (data.gift as any).takenUserId ?? null };
                    setLocalGifts((prev) => [...prev, created]);
                    Swal.fire({ title: 'Cadeau ajouté !', icon: 'success', timer: 1500, showConfirmButton: false });
                } else {
                    Swal.fire({ title: 'Erreur', text: "Impossible d'ajouter ce cadeau.", icon: 'error' }); return;
                }
            }
        } catch (err: any) {
            Swal.fire({ title: 'Erreur', text: 'Impossible de sauvegarder', icon: 'error' }); return;
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
                    Swal.fire({ title: isTaken ? 'Cadeau libéré !' : 'Cadeau réservé !', icon: 'success', timer: 1500, showConfirmButton: false });
                }
            } else {
                Swal.fire({ title: 'Erreur', text: 'Impossible de réserver ce cadeau.', icon: 'error' });
            }
        } catch (err) {
            Swal.fire({ title: 'Erreur', text: 'Erreur lors de la réservation', icon: 'error' });
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
        if (!over || active.id === over.id) return;
        const oldIndex = localGifts.findIndex((g) => g.id === active.id);
        const newIndex = localGifts.findIndex((g) => g.id === over.id);
        const reordered = arrayMove(localGifts, oldIndex, newIndex).map((g, i) => ({ ...g, order: i + 1 }));
        setLocalGifts(reordered);
        AxiosWrapper.post('/api/gift', { gifts: reordered, initiatorUserId: connectedUser?.userId, userGiftId: user.id })
            .catch((err) => console.error('Erreur mise à jour ordre:', err));
    };

    const isCreating = selectedGiftId === NEW_GIFT_SENTINEL;
    const selectedGift = isCreating ? null : (localGifts.find((g) => g.id === selectedGiftId) ?? null);
    const isEditing = !!editingGiftId && editingGiftId === selectedGift?.id;
    const modalOpen = selectedGiftId !== null;

    const pageTitle = isOwnList ? 'Ma liste de cadeaux' : `Liste de cadeaux de ${user.name}`;

    return (
        <Layout selectedHeader={EHeader.GiftList} pageTitle={pageTitle}>
            <div>
                <div className="mb-8">
                    <p className="text-sm text-gray-500 mb-1">Liste de cadeaux</p>
                    <h1 className="text-2xl font-bold text-gray-800">{user.name}</h1>
                </div>

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

                {/* Toggle vue liste / grille */}
                <div className="flex justify-end mb-3">
                    <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                        <span
                            role="button"
                            onClick={() => { setViewMode('list'); localStorage.setItem('giftListViewMode', 'list'); }}
                            title="Vue liste"
                            className={`px-3 py-1.5 text-sm transition-colors cursor-pointer select-none ${
                                viewMode === 'list' ? 'bg-vertNoel text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </span>
                        <span
                            role="button"
                            onClick={() => { setViewMode('grid'); localStorage.setItem('giftListViewMode', 'grid'); }}
                            title="Vue grille"
                            className={`px-3 py-1.5 text-sm transition-colors cursor-pointer select-none border-l border-gray-200 ${
                                viewMode === 'grid' ? 'bg-vertNoel text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h6v6H4zM14 5h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
                            </svg>
                        </span>
                    </div>
                </div>

                <Suspense fallback="loading...">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={localGifts}>
                            <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-3' : 'flex flex-col gap-2'}>
                            {localGifts
                                .filter((gift) => !filteringTakenGifts || !gift.takenUserId)
                                .map((gift, idx) => (
                                    <SortableItem key={`gift_${gift.id}`} gift={gift} idx={idx + 1} canReorder={userCanAddGift} viewMode={viewMode}>
                                        <div
                                            className={`w-full cursor-pointer p-3 rounded-lg flex items-start gap-3 ${
                                                viewMode === 'grid' ? 'flex-wrap' : 'justify-between'
                                            }`}
                                            onClick={() => setSelectedGiftId(gift.id)}
                                        >
                                            <span className={`font-medium ${viewMode === 'grid' ? 'w-full' : 'flex-1 min-w-0'} ${!isOwnList && gift.takenUserId && gift.giftType !== ('UNLIMITED' as GiftType) && gift.giftType !== ('MULTIPLE' as GiftType) ? 'line-through text-gray-400' : ''}`}>
                                                {gift.name}
                                            </span>
                                            {gift.giftType === 'MULTIPLE' && (
                                                <span className="shrink-0 text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                                                    🧩 {gift.subGiftsCount ?? 0} élément{(gift.subGiftsCount ?? 0) !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                            {gift.giftType === ('UNLIMITED' as GiftType) && (
                                                <span className="shrink-0 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                                    {isOwnList ? '🔁 Illimité' : `🔁 ${(gift.takenByList ?? []).length} pris`}
                                                </span>
                                            )}
                                            {!isOwnList && gift.giftType === 'SIMPLE' && (
                                                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                                                    gift.takenUserId ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {gift.takenUserId ? 'Pris' : 'Libre'}
                                                </span>
                                            )}
                                        </div>
                                    </SortableItem>
                                ))}                            </div>
                        </SortableContext>
                    </DndContext>
                </Suspense>

                {localGifts.filter((g) => !filteringTakenGifts || !g.takenUserId).length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-4xl mb-3">🎁</p>
                        {isOwnList ? (
                            <>
                                <p className="font-semibold text-gray-700 mb-1">Ta liste est vide pour l&apos;instant</p>
                                <p className="text-sm text-gray-400">Ajoute tes premières envies — tes proches pourront les réserver en secret !</p>
                            </>
                        ) : (
                            <>
                                <p className="font-semibold text-gray-700 mb-1">Cette liste est encore vide</p>
                                <p className="text-sm text-gray-400">Revenez plus tard, des idées cadeaux seront bientôt ajoutées.</p>
                            </>
                        )}
                    </div>
                )}

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
                                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                                                Ce cadeau est déjà pris
                                                {loadingGroupUsers
                                                    ? <span className="inline-block h-3 w-20 bg-red-200 rounded animate-pulse" />
                                                    : groupUserMap[selectedGift!.takenUserId] && (
                                                        <> — par <b>{groupUserMap[selectedGift!.takenUserId]?.name}</b></>
                                                    )
                                                }
                                            </div>
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
                                        {selectedGift!.giftType === ('UNLIMITED' as GiftType) && !isOwnList && (
                                            <UnlimitedGiftTakers
                                                gift={selectedGift!}
                                                userId={connectedUser?.userId}
                                                groupUserMap={groupUserMap}
                                                onGiftUpdate={() => {
                                                    AxiosWrapper.get(`/api/gift?giftId=${selectedGift!.id}`).then((res) => {
                                                        const data = res?.data as TGiftApiResult;
                                                        if (data?.success && data.gift) {
                                                            const updated: GiftWithTakenUserId = { ...data.gift, takenUserId: (data.gift as any).takenUserId ?? null, takenByList: (data.gift as any).takenByList ?? [] };
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
                                {!isCreating && !userCanAddGift && selectedGift!.giftType === 'SIMPLE' && selectedGift!.takenUserId === connectedUser?.userId && (
                                    <CustomButton onClick={() => onBlockUnBlockGiftClick(selectedGift!)} disabled={takingGiftId === selectedGift!.id}>
                                        {takingGiftId === selectedGift!.id ? 'Libération...' : 'Je ne prends plus ce cadeau'}
                                    </CustomButton>
                                )}
                                {!isCreating && !userCanAddGift && selectedGift!.giftType === 'SIMPLE' && !selectedGift!.takenUserId && (
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
            user: (({ updatedAt, createdAt, ...u }) => u)(user!),
            giftList: giftList.map(({ updatedAt, createdAt, ...gift }) => ({
                ...gift,
                takenByList: (gift.takenByList ?? []).map((t) => ({
                    ...t,
                    takenAt: t.takenAt instanceof Date ? t.takenAt.toISOString() : t.takenAt
                }))
            }))
        }
    };
}

export default GiftPage;

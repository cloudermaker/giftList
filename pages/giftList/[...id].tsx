import { ReactNode, Suspense, startTransition, useCallback, useEffect, useOptimistic, useRef, useState } from 'react';
import { Layout } from '@/components/layout';
import { PageTitle } from '@/components/atoms/PageTitle';
import { EHeader } from '@/components/customHeader';
import ModernLink from '@/components/atoms/ModernLink';
import { toSafeUrl } from '@/lib/ui/url';
import { LayoutGrid, List } from 'lucide-react';
import { GiftShopLink } from '@/components/atoms/GiftShopLink';
import { GetServerSidePropsContext } from 'next';
import { verifySession } from '@/lib/auth/session';
import { COOKIE_NAME } from '@/lib/auth/authService';
import { touchGroupActivity } from '@/lib/db/groupManager';
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
import { toast, alertError, confirmDestructive, getSwal } from '@/lib/ui/alert';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import { TUserApiResult } from '../api/user';
import SubGiftList from '@/components/SubGiftList';
import UnlimitedGiftTakers from '@/components/UnlimitedGiftTakers';
import { formatDay } from '@/lib/ui/dates';

const NEW_GIFT_SENTINEL = 'new';

function SortableItem({
    gift,
    children,
    idx,
    canReorder,
    viewMode = 'list'
}: {
    gift: GiftWithTakenUserId;
    children: ReactNode;
    idx: number;
    canReorder: boolean;
    viewMode?: 'list' | 'grid';
}) {
    const { listeners, setNodeRef, transform } = useSortable({ id: gift.id });
    const style = { transform: CSS.Transform.toString(transform) };
    const color = idx === 1 ? 'orange' : idx === 2 ? 'silver' : 'brown';
    const localListeners = canReorder ? listeners : null;
    const localStyle = canReorder ? { cursor: 'grab', touchAction: 'none' } : {};

    const leftIcon =
        idx <= 3 ? (
            <Medal className="pr-3 w-9" color={color} />
        ) : canReorder ? (
            <Drag className="pr-3 w-9" />
        ) : (
            <div className="pr-3 w-9" />
        );

    return (
        <div
            className={`item flex ${viewMode === 'grid' ? 'items-start p-2! sm:p-[18px]!' : 'items-center p-2.5! sm:p-[18px]!'}`}
            ref={setNodeRef}
            style={style}
        >
            {viewMode === 'list' && (
                <div {...localListeners} style={localStyle}>
                    {leftIcon}
                </div>
            )}
            {children}
        </div>
    );
}

const GiftPage = ({ user, giftList = [] }: { user: User; giftList: GiftWithTakenUserId[] }) => {
    const { connectedUser } = useCurrentUser();

    const isOwnList = user.id === connectedUser?.userId;
    const userCanAddGift = isOwnList || connectedUser?.isAdmin === true;

    const [localGifts, setLocalGifts] = useState<GiftWithTakenUserId[]>(giftList);
    // Réservation/libération d'un cadeau simple affichée tout de suite, annulée si le serveur refuse
    const [displayGifts, setOptimisticTaken] = useOptimistic(
        localGifts,
        (gifts, change: { id: string; takenUserId: string | null }) =>
            gifts.map((g) =>
                g.id === change.id
                    ? ({
                          ...g,
                          takenUserId: change.takenUserId,
                          takenByList: change.takenUserId
                              ? [{ id: '', userId: change.takenUserId, takenAt: new Date().toISOString() }]
                              : []
                      } as GiftWithTakenUserId)
                    : g
            )
    );
    const [filteringTakenGifts, setFilteringTakenGifts] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    // Préférence lue après le montage : la lire pendant le rendu créait un écart serveur/navigateur (erreur d'hydratation)
    useEffect(() => {
        if (localStorage.getItem('giftListViewMode') === 'grid') setViewMode('grid');
    }, []);

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

    const [datesOpen, setDatesOpen] = useState(false);
    const datesRef = useRef<HTMLDivElement>(null);
    // Fiche « ? » : se ferme au clic en dehors ou sur Échap
    useEffect(() => {
        if (!datesOpen) return;
        const onDown = (e: PointerEvent) => {
            if (!datesRef.current?.contains(e.target as Node)) setDatesOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDatesOpen(false);
        document.addEventListener('pointerdown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [datesOpen]);
    const clearForm = useCallback(() => {
        setFormName('');
        setFormDescription('');
        setFormLink('');
        setFormType('SIMPLE');
        setEditingGiftId('');
        setDatesOpen(false);
    }, []);

    const closeModal = useCallback(() => {
        clearForm();
        setSelectedGiftId(null);
    }, [clearForm]);
    const openCreateModal = () => {
        clearForm();
        setSelectedGiftId(NEW_GIFT_SENTINEL);
    };

    // Resync à la navigation vers une autre liste
    useEffect(() => {
        setLocalGifts(giftList);
        closeModal();
    }, [user.id, giftList, closeModal]);

    // Fermer avec Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeModal();
        };
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
            } catch {
                /* silently fail */
            } finally {
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
        const confirmed = await confirmDestructive({
            title: 'Es-tu certain de vouloir supprimer ce cadeau ?',
            text: 'Il ne sera pas possible de revenir en arrière!'
        });
        if (!confirmed) return;
        try {
            const res = await AxiosWrapper.delete(`/api/gift/${giftId}`);
            const data = res?.data as TGiftApiResult;
            if (data?.success) {
                setLocalGifts((prev) => prev.filter((g) => g.id !== giftId));
                closeModal();
                toast('Supprimé !');
            } else {
                alertError('Erreur', 'Impossible de supprimer ce cadeau.');
            }
        } catch (err: any) {
            alertError('Erreur', 'Impossible de supprimer.');
        }
    };

    const saveGift = async (giftId: string | null = null) => {
        const currentGift: GiftWithTakenUserId = structuredClone(localGifts.find((g) => g.id === giftId)!);

        if (giftId && currentGift?.giftType === 'MULTIPLE' && formType === 'SIMPLE' && (currentGift.subGiftsCount ?? 0) > 0) {
            (await getSwal()).fire({
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
                    // La réponse ne porte pas les réservations : on garde celles déjà connues
                    setLocalGifts((prev) =>
                        prev.map((g) =>
                            g.id === giftId ? { ...data.gift!, takenUserId: g.takenUserId, takenByList: g.takenByList } : g
                        )
                    );
                    toast('Cadeau modifié !');
                } else {
                    alertError('Erreur', 'Impossible de modifier ce cadeau.');
                    return;
                }
            } else {
                const res = await AxiosWrapper.post('/api/gift', {
                    gift: giftToSave,
                    initiatorUserId: connectedUser?.userId,
                    userGiftId: user.id
                });
                const data = res?.data as TGiftApiResult;
                if (data?.success && data.gift) {
                    const created: GiftWithTakenUserId = { ...data.gift, takenUserId: (data.gift as any).takenUserId ?? null };
                    setLocalGifts((prev) => [...prev, created]);
                    toast('Cadeau ajouté !');
                } else {
                    alertError('Erreur', "Impossible d'ajouter ce cadeau.");
                    return;
                }
            }
        } catch (err: any) {
            alertError('Erreur', 'Impossible de sauvegarder');
            return;
        }
        closeModal();
    };

    const onBlockUnBlockGiftClick = (giftToUpdate: GiftWithTakenUserId) => {
        const isTaken = giftToUpdate.takenUserId != null;
        const isSimple = giftToUpdate.giftType === ('SIMPLE' as GiftType);
        const takenUserId = isTaken ? null : (connectedUser?.userId ?? null);
        setTakingGiftId(giftToUpdate.id);
        startTransition(async () => {
            if (isSimple) setOptimisticTaken({ id: giftToUpdate.id, takenUserId });
            try {
                const res = isTaken
                    ? await AxiosWrapper.delete(`/api/gift/${giftToUpdate.id}/take`, { userId: connectedUser?.userId })
                    : await AxiosWrapper.post(`/api/gift/${giftToUpdate.id}/take`, { userId: connectedUser?.userId });
                if (res?.data?.success) {
                    if (isSimple) {
                        startTransition(() =>
                            setLocalGifts((prev) =>
                                prev.map((g) =>
                                    g.id === giftToUpdate.id
                                        ? ({
                                              ...g,
                                              takenUserId,
                                              takenByList: takenUserId
                                                  ? [{ id: '', userId: takenUserId, takenAt: new Date().toISOString() }]
                                                  : []
                                          } as GiftWithTakenUserId)
                                        : g
                                )
                            )
                        );
                    } else {
                        // MULTIPLE/UNLIMITED : état serveur plus riche (sous-cadeaux, multi-réservations) → re-fetch
                        const refreshRes = await AxiosWrapper.get(`/api/gift?giftId=${giftToUpdate.id}`);
                        const refreshData = refreshRes?.data as TGiftApiResult;
                        if (refreshData?.success && refreshData.gift) {
                            const updated: GiftWithTakenUserId = {
                                ...refreshData.gift,
                                takenUserId: (refreshData.gift as any).takenUserId ?? null
                            };
                            startTransition(() =>
                                setLocalGifts((prev) => prev.map((g) => (g.id === giftToUpdate.id ? updated : g)))
                            );
                        }
                    }
                    toast(isTaken ? 'Cadeau libéré !' : 'Cadeau réservé !');
                    if (!isTaken) closeModal();
                } else {
                    alertError('Erreur', 'Impossible de réserver ce cadeau.');
                }
            } catch (err) {
                alertError('Erreur', 'Erreur lors de la réservation');
            } finally {
                setTakingGiftId(null);
            }
        });
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
        AxiosWrapper.post('/api/gift', { gifts: reordered, initiatorUserId: connectedUser?.userId, userGiftId: user.id }).catch(
            (err) => console.error('Erreur mise à jour ordre:', err)
        );
    };

    const visibleGiftsCount = displayGifts.filter((g) => !filteringTakenGifts || !g.takenUserId).length;

    const isCreating = selectedGiftId === NEW_GIFT_SENTINEL;
    const selectedGift = isCreating ? null : (displayGifts.find((g) => g.id === selectedGiftId) ?? null);
    const isEditing = !!editingGiftId && editingGiftId === selectedGift?.id;
    const modalOpen = selectedGiftId !== null;

    const pageTitle = isOwnList ? 'Ma liste' : `Liste de ${user.name}`;

    return (
        <Layout selectedHeader={EHeader.GiftList} pageTitle={pageTitle}>
            <div>
                <PageTitle eyebrow="Liste de cadeaux">{user.name}</PageTitle>

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

                {/* Ajouter (en haut, évite de scroller) + toggle vue liste / grille */}
                <div className="flex justify-between items-center mb-3">
                    <div>
                        {userCanAddGift && (
                            <CustomButton variant="green" onClick={openCreateModal}>
                                Ajouter un cadeau
                            </CustomButton>
                        )}
                    </div>
                    <div className="inline-flex rounded-lg border border-line overflow-hidden">
                        <button
                            type="button"
                            onClick={() => {
                                setViewMode('list');
                                localStorage.setItem('giftListViewMode', 'list');
                            }}
                            title="Vue liste"
                            className={`px-3 py-1.5 text-sm transition-colors cursor-pointer select-none ${
                                viewMode === 'list' ? 'bg-vertNoel text-white' : 'bg-surface text-fg-faint hover:bg-surface-muted'
                            }`}
                        >
                            <List className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setViewMode('grid');
                                localStorage.setItem('giftListViewMode', 'grid');
                            }}
                            title="Vue grille"
                            className={`px-3 py-1.5 text-sm transition-colors cursor-pointer select-none border-l border-line ${
                                viewMode === 'grid' ? 'bg-vertNoel text-white' : 'bg-surface text-fg-faint hover:bg-surface-muted'
                            }`}
                        >
                            <LayoutGrid className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>

                <Suspense fallback="loading...">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={localGifts}>
                            <div
                                className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 gap-3' : 'flex flex-col gap-2'}
                            >
                                {displayGifts
                                    .filter((gift) => !filteringTakenGifts || !gift.takenUserId)
                                    .map((gift, idx) => (
                                        <SortableItem
                                            key={`gift_${gift.id}`}
                                            gift={gift}
                                            idx={idx + 1}
                                            canReorder={userCanAddGift}
                                            viewMode={viewMode}
                                        >
                                            <div
                                                className={`w-full cursor-pointer rounded-lg flex items-start gap-3 ${
                                                    viewMode === 'grid'
                                                        ? 'flex-wrap p-1 sm:p-3'
                                                        : 'flex-wrap sm:flex-nowrap gap-y-2 p-1.5 sm:p-3 justify-between'
                                                }`}
                                                onClick={() => setSelectedGiftId(gift.id)}
                                            >
                                                <span
                                                    className={`font-medium ${viewMode === 'grid' ? `w-full ${toSafeUrl(gift.url) ? 'pr-7' : ''}` : 'w-full sm:w-auto sm:flex-1 min-w-0'} ${!isOwnList && gift.takenUserId && gift.giftType !== ('UNLIMITED' as GiftType) && gift.giftType !== ('MULTIPLE' as GiftType) ? 'line-through text-fg-subtle' : ''}`}
                                                >
                                                    {gift.name}
                                                </span>
                                                {viewMode === 'grid' && toSafeUrl(gift.url) && (
                                                    // Grille : lien dans le coin haut-droit de la carte, la ligne du bas reste aux badges
                                                    <GiftShopLink
                                                        url={toSafeUrl(gift.url)!}
                                                        name={gift.name}
                                                        className="absolute top-1 right-1 sm:top-2 sm:right-2"
                                                    />
                                                )}
                                                {/* Badges (+ lien en vue liste) : sous le nom en grille et en liste sur mobile (badges à gauche, lien à droite), en bout de ligne sinon */}
                                                <div
                                                    className={`flex items-center gap-2 shrink-0 empty:hidden ${viewMode === 'grid' ? 'w-full' : 'w-full sm:w-auto'}`}
                                                >
                                                    {gift.giftType === 'MULTIPLE' && (
                                                        <span className="shrink-0 text-xs bg-info-tint text-info-fg px-2 py-0.5 rounded-full font-medium">
                                                            🧩 {gift.subGiftsCount ?? 0} élément
                                                            {(gift.subGiftsCount ?? 0) !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                    {gift.giftType === ('UNLIMITED' as GiftType) && (
                                                        <span className="shrink-0 text-xs bg-accent-tint text-accent-fg-strong px-2 py-0.5 rounded-full font-medium">
                                                            {isOwnList
                                                                ? '🔁 Illimité'
                                                                : `🔁 ${(gift.takenByList ?? []).length} pris`}
                                                        </span>
                                                    )}
                                                    {!isOwnList && gift.giftType === 'SIMPLE' && (
                                                        <span
                                                            className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                                                                gift.takenUserId
                                                                    ? 'bg-danger-tint text-danger-fg'
                                                                    : 'bg-success-tint text-success-fg-strong'
                                                            }`}
                                                        >
                                                            {gift.takenUserId ? 'Pris' : 'Libre'}
                                                        </span>
                                                    )}
                                                    {viewMode === 'list' && toSafeUrl(gift.url) && (
                                                        <GiftShopLink
                                                            url={toSafeUrl(gift.url)!}
                                                            name={gift.name}
                                                            className="-my-1 ml-auto"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </SortableItem>
                                    ))}{' '}
                            </div>
                        </SortableContext>
                    </DndContext>
                </Suspense>

                {visibleGiftsCount === 0 && (
                    <div className="text-center py-12">
                        <p className="text-4xl mb-3">🎁</p>
                        {isOwnList ? (
                            <>
                                <p className="font-semibold text-fg-soft mb-1">Ta liste est vide pour l&apos;instant</p>
                                <p className="text-sm text-fg-subtle">
                                    Ajoute tes premières envies — tes proches pourront les réserver en secret !
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="font-semibold text-fg-soft mb-1">Cette liste est encore vide</p>
                                <p className="text-sm text-fg-subtle">
                                    Revenez plus tard, des idées cadeaux seront bientôt ajoutées.
                                </p>
                            </>
                        )}
                    </div>
                )}

                {/* Bouton du bas seulement quand la liste est assez longue pour scroller */}
                {userCanAddGift && visibleGiftsCount >= 5 && (
                    <CustomButton variant="green" onClick={openCreateModal}>
                        Ajouter un cadeau
                    </CustomButton>
                )}

                {/* Modal : création ou détail/édition */}
                {modalOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                        <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
                        <div className="relative bg-surface w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl shadow-xl max-h-[90vh] flex flex-col">
                            {/* Header */}
                            <div className="relative flex items-start justify-between px-5 py-4 border-b gap-3">
                                <h2 className="font-bold text-lg leading-snug">
                                    {isCreating ? 'Nouveau cadeau' : selectedGift!.name}
                                </h2>
                                <div ref={datesRef} className="relative flex items-center gap-2 shrink-0">
                                    {!isCreating && (
                                        <button
                                            type="button"
                                            aria-label="Dates du cadeau"
                                            aria-expanded={datesOpen}
                                            onClick={() => setDatesOpen((v) => !v)}
                                            className="w-7 h-7 flex items-center justify-center rounded-full border border-line-strong text-sm font-semibold text-fg-faint hover:bg-surface-sunken"
                                        >
                                            ?
                                        </button>
                                    )}
                                    <div
                                        onClick={closeModal}
                                        className="w-7 h-7 flex items-center justify-center text-fg-subtle hover:text-fg-muted text-2xl leading-none cursor-pointer"
                                    >
                                        ✕
                                    </div>
                                    {datesOpen && !isCreating && <GiftDates gift={selectedGift!} showTaken={!isOwnList} />}
                                </div>
                            </div>

                            {/* Body */}
                            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                                {isCreating || isEditing ? (
                                    <GiftForm
                                        formName={formName}
                                        setFormName={setFormName}
                                        formDescription={formDescription}
                                        setFormDescription={setFormDescription}
                                        formLink={formLink}
                                        setFormLink={setFormLink}
                                        formType={formType}
                                        setFormType={setFormType}
                                        autoFocusName
                                    />
                                ) : (
                                    <>
                                        {selectedGift!.description ? (
                                            <p className="text-fg-soft">{selectedGift!.description}</p>
                                        ) : (
                                            <p className="text-fg-soft italic">Pas de description</p>
                                        )}
                                        {toSafeUrl(selectedGift!.url) ? (
                                            <p>
                                                <ModernLink href={selectedGift!.url} />
                                            </p>
                                        ) : (
                                            <p className="text-fg-soft italic">Pas de lien</p>
                                        )}
                                        {!isOwnList &&
                                            selectedGift!.takenUserId &&
                                            selectedGift!.takenUserId !== connectedUser?.userId && (
                                                <div className="p-3 bg-danger-soft border border-danger-line rounded-lg text-sm text-danger-fg-strong flex items-center gap-2">
                                                    Ce cadeau est déjà pris
                                                    {loadingGroupUsers ? (
                                                        <span className="inline-block h-3 w-20 bg-danger-tint-strong rounded-sm animate-pulse" />
                                                    ) : (
                                                        groupUserMap[selectedGift!.takenUserId] && (
                                                            <>
                                                                {' '}
                                                                — par <b>{groupUserMap[selectedGift!.takenUserId]?.name}</b>
                                                            </>
                                                        )
                                                    )}
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
                                                            const updated: GiftWithTakenUserId = {
                                                                ...data.gift,
                                                                takenUserId: (data.gift as any).takenUserId ?? null
                                                            };
                                                            setLocalGifts((prev) =>
                                                                prev.map((g) => (g.id === selectedGift!.id ? updated : g))
                                                            );
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
                                                            const updated: GiftWithTakenUserId = {
                                                                ...data.gift,
                                                                takenUserId: (data.gift as any).takenUserId ?? null,
                                                                takenByList: (data.gift as any).takenByList ?? []
                                                            };
                                                            setLocalGifts((prev) =>
                                                                prev.map((g) => (g.id === selectedGift!.id ? updated : g))
                                                            );
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
                                    <CustomButton variant="green" onClick={() => saveGift(null)} disabled={!formName}>
                                        Créer
                                    </CustomButton>
                                )}
                                {!isCreating &&
                                    userCanAddGift &&
                                    (isEditing ? (
                                        <>
                                            <CustomButton
                                                variant="green"
                                                onClick={() => saveGift(selectedGift!.id)}
                                                disabled={!formName}
                                            >
                                                Valider
                                            </CustomButton>
                                            <CustomButton onClick={clearForm}>Annuler</CustomButton>
                                        </>
                                    ) : (
                                        <>
                                            <CustomButton variant="green" onClick={() => startEditing(selectedGift!)}>
                                                Modifier
                                            </CustomButton>
                                            <CustomButton onClick={() => removeGift(selectedGift!.id)}>Supprimer</CustomButton>
                                        </>
                                    ))}
                                {/* Réserver : tout le monde sauf le propriétaire (un admin peut aussi réserver) */}
                                {!isCreating &&
                                    !isOwnList &&
                                    selectedGift!.giftType === 'SIMPLE' &&
                                    selectedGift!.takenUserId === connectedUser?.userId && (
                                        <CustomButton
                                            onClick={() => onBlockUnBlockGiftClick(selectedGift!)}
                                            disabled={takingGiftId === selectedGift!.id}
                                        >
                                            Je ne prends plus ce cadeau
                                        </CustomButton>
                                    )}
                                {!isCreating &&
                                    !isOwnList &&
                                    selectedGift!.giftType === 'SIMPLE' &&
                                    !selectedGift!.takenUserId && (
                                        <CustomButton
                                            variant="green"
                                            onClick={() => onBlockUnBlockGiftClick(selectedGift!)}
                                            disabled={takingGiftId === selectedGift!.id}
                                        >
                                            Je prends ce cadeau
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

/** Petite fiche « ? » : quand le cadeau a été ajouté, modifié et (pour les autres) réservé. */
const GiftDates = ({ gift, showTaken }: { gift: GiftWithTakenUserId; showTaken: boolean }) => {
    const created = formatDay(gift.createdAt);
    const updated = formatDay(gift.updatedAt);
    const takenAt = gift.giftType === 'SIMPLE' ? gift.takenByList?.[0]?.takenAt : undefined;
    return (
        <div
            role="dialog"
            aria-label="Dates du cadeau"
            className="absolute right-0 top-full mt-2 z-10 whitespace-nowrap bg-surface border border-line rounded-lg shadow-lg px-4 py-3 text-sm text-fg-soft space-y-1"
        >
            <p>Ajouté le {created}</p>
            {/* Modifié le même jour que l'ajout : rien de plus à dire */}
            {updated !== created && <p>Modifié le {updated}</p>}
            {showTaken && takenAt && <p>Réservé le {formatDay(takenAt)}</p>}
        </div>
    );
};

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const { query } = context;
    const userId = query.id?.toString() ?? '';

    if (Number.isNaN(userId)) return { notFound: true };

    // Ouverture directe d'une liste (favori) : compte aussi comme activité du groupe
    const session = verifySession(context.req.cookies[COOKIE_NAME]);

    // En parallèle des lectures : un aller-retour base de moins avant la réponse
    const [user, giftList] = await Promise.all([
        getUserById(userId),
        getGiftsFromUserId(userId),
        session ? touchGroupActivity(session.groupId) : null
    ]);

    // Membre supprimé (ou purgé) : lien obsolète → 404
    if (!user) return { notFound: true };
    const isOwner = session?.userId === user.id;

    return {
        props: {
            user: (({ updatedAt, createdAt, ...u }) => u)(user),
            giftList: giftList.map((gift) => ({
                ...gift,
                createdAt: gift.createdAt.toISOString(),
                updatedAt: gift.updatedAt.toISOString(),
                // Le propriétaire ne reçoit aucune trace des réservations
                ...(isOwner
                    ? { takenUserId: null, takenByList: [] }
                    : {
                          takenByList: (gift.takenByList ?? []).map((t) => ({
                              ...t,
                              takenAt: t.takenAt instanceof Date ? t.takenAt.toISOString() : t.takenAt
                          }))
                      })
            }))
        }
    };
}

export default GiftPage;

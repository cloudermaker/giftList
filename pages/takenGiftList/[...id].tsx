import CustomButton from '@/components/atoms/customButton';
import { EHeader } from '@/components/customHeader';
import { Layout } from '@/components/layout';
import { PageTitle } from '@/components/atoms/PageTitle';
import { Modal } from '@/components/atoms/Modal';
import ModernLink from '@/components/atoms/ModernLink';
import { PersonalGiftModal, TPersonalGiftForm } from '@/components/PersonalGiftModal';
import { RecipientAvatar, TakenGiftRow, TRecipient, TTakenRow } from '@/components/TakenGiftRow';
import { getTakenGiftsFromUserId } from '@/lib/db/giftManager';
import { getPersonalGiftsByUser } from '@/lib/db/personalGiftManager';
import { BOUGHT_RETENTION_MONTHS } from '@/lib/retention';
import { User } from '@prisma/client';
import { NextPageContext } from 'next';
import { useState, useEffect } from 'react';
import { toast, alertError, confirmDestructive } from '@/lib/ui/alert';
import { toSafeUrl } from '@/lib/ui/url';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

// Pas encore achetés d'abord, puis par nom
const byBoughtThenName = (a: TTakenRow, b: TTakenRow) =>
    Number(!!a.boughtAt) - Number(!!b.boughtAt) || a.name.localeCompare(b.name, 'fr');

const toPersonalRow = (pg: any): TTakenRow => ({
    key: `personal_${pg.id}`,
    kind: 'personal',
    id: pg.id,
    takenGiftId: null,
    parentGiftId: null,
    parentName: null,
    name: pg.name,
    description: pg.description ?? null,
    url: pg.url ?? null,
    giftType: 'SIMPLE',
    recipient: pg.forUser ? { id: pg.forUser.id, name: pg.forUser.name } : null,
    boughtAt: pg.boughtAt ? new Date(pg.boughtAt).toISOString() : null
});

const TakenGiftList = ({ reserved, personal }: { reserved: TTakenRow[]; personal: TTakenRow[] }): JSX.Element => {
    const { connectedUser } = useCurrentUser();
    const [reservedRows, setReservedRows] = useState<TTakenRow[]>(reserved);
    const [personalRows, setPersonalRows] = useState<TTakenRow[]>(personal);
    const [groupUsers, setGroupUsers] = useState<User[]>([]);
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    // null = fermé, 'new' = création, sinon clé du cadeau personnel édité
    const [personalFormKey, setPersonalFormKey] = useState<string | null>(null);

    useEffect(() => {
        const loadGroupUsers = async () => {
            if (!connectedUser?.groupId) return;
            try {
                const response = await AxiosWrapper.get(`/api/user?groupid=${connectedUser.groupId}`);
                if (response?.data?.success && response.data.users) setGroupUsers(response.data.users);
            } catch {
                /* silently fail */
            }
        };
        loadGroupUsers();
    }, [connectedUser?.groupId]);

    const allRows = [...reservedRows, ...personalRows];
    const selected = allRows.find((r) => r.key === selectedKey) ?? null;
    const editedPersonal = personalRows.find((r) => r.key === personalFormKey) ?? null;

    const replaceRow = (row: TTakenRow) => {
        const setter = row.kind === 'reserved' ? setReservedRows : setPersonalRows;
        setter((rows) => rows.map((r) => (r.key === row.key ? row : r)));
    };

    const toggleBought = async (row: TTakenRow) => {
        const bought = !row.boughtAt;
        setBusyKey(row.key);
        try {
            const res =
                row.kind === 'reserved'
                    ? await AxiosWrapper.patch(`/api/gift/${row.id}/take`, { takenGiftId: row.takenGiftId, bought })
                    : await AxiosWrapper.put(`/api/personalGift/${row.id}`, { bought });
            if (res?.data?.success) {
                replaceRow({ ...row, boughtAt: bought ? new Date().toISOString() : null });
            } else {
                alertError('Erreur', 'Impossible de mettre à jour ce cadeau.');
            }
        } finally {
            setBusyKey(null);
        }
    };

    const releaseGift = async (row: TTakenRow) => {
        if (row.boughtAt) {
            const confirmed = await confirmDestructive({
                title: 'Tu as déjà acheté ce cadeau',
                text: 'Le libérer quand même ? Il redeviendra disponible pour les autres.'
            });
            if (!confirmed) return;
        }
        setBusyKey(row.key);
        try {
            // UNLIMITED : uniquement cette réservation ; sinon le serveur libère aussi les sous-cadeaux
            const body = row.giftType === 'UNLIMITED' ? { takenGiftId: row.takenGiftId } : {};
            const res = await AxiosWrapper.delete(`/api/gift/${row.id}/take`, body);
            if (res?.data?.success) {
                setReservedRows((rows) =>
                    rows.filter((r) =>
                        row.giftType === 'UNLIMITED' ? r.key !== row.key : r.id !== row.id && r.parentGiftId !== row.id
                    )
                );
                setSelectedKey(null);
                toast('Cadeau libéré !');
            } else {
                alertError('Erreur', 'Impossible de libérer ce cadeau. Réessayez dans quelques instants.');
            }
        } finally {
            setBusyKey(null);
        }
    };

    const savePersonalGift = async (data: TPersonalGiftForm): Promise<void> => {
        const fields = {
            name: data.name,
            description: data.description || null,
            url: data.link || null,
            forUserId: data.forUserId || null
        };
        const res = editedPersonal
            ? await AxiosWrapper.put(`/api/personalGift/${editedPersonal.id}`, fields)
            : await AxiosWrapper.post('/api/personalGift', { personalGift: { ...fields, groupId: connectedUser?.groupId } });
        const saved = res?.data?.success ? (res.data.gift ?? res.data.personalGift) : null;
        if (!saved) {
            alertError('Erreur', "Impossible d'enregistrer ce cadeau. Réessayez dans quelques instants.");
            throw new Error('api error');
        }
        const row = toPersonalRow(saved);
        if (editedPersonal) replaceRow(row);
        else setPersonalRows((rows) => [...rows, row]);
        // Comme sur la liste de cadeaux : enregistrer ferme aussi la fiche
        setSelectedKey(null);
        toast(editedPersonal ? 'Cadeau modifié !' : 'Cadeau ajouté !');
    };

    const deletePersonalGift = async (row: TTakenRow): Promise<void> => {
        const confirmed = await confirmDestructive({
            title: 'Es-tu certain de vouloir supprimer ce cadeau?',
            text: 'Il ne sera pas possible de revenir en arrière!'
        });
        if (!confirmed) return;

        setBusyKey(row.key);
        try {
            const res = await AxiosWrapper.delete(`/api/personalGift/${row.id}`);
            if (res?.data?.success === true) {
                setPersonalRows((rows) => rows.filter((r) => r.key !== row.key));
                setSelectedKey(null);
                toast('Supprimé !');
            } else {
                alertError('Erreur', 'Impossible de supprimer ce cadeau.');
            }
        } finally {
            setBusyKey(null);
        }
    };

    // Réservations groupées par destinataire (propriétaire de la liste)
    const groups = Object.values(
        reservedRows.reduce<Record<string, { recipient: TRecipient; rows: TTakenRow[] }>>((acc, row) => {
            const recipient = row.recipient ?? { id: 'unknown', name: '?' };
            (acc[recipient.id] ??= { recipient, rows: [] }).rows.push(row);
            return acc;
        }, {})
    ).sort((a, b) => a.recipient.name.localeCompare(b.recipient.name, 'fr'));

    const renderRow = (row: TTakenRow) => (
        <TakenGiftRow
            key={row.key}
            row={row}
            busy={busyKey === row.key}
            onOpen={() => setSelectedKey(row.key)}
            onToggleBought={() => toggleBought(row)}
        />
    );

    return (
        <Layout selectedHeader={EHeader.TakenGiftList}>
            <div>
                <PageTitle>Mes réservations</PageTitle>

                {/* ── Cadeaux réservés, par destinataire ── */}
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Cadeaux réservés</p>
                {groups.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center mb-8 shadow-xs">
                        <p className="text-3xl mb-2">🎁</p>
                        <p className="text-sm text-gray-400">Aucun cadeau réservé pour le moment</p>
                    </div>
                ) : (
                    <div className="mb-8 space-y-6">
                        {groups.map(({ recipient, rows }) => {
                            const boughtCount = rows.filter((r) => r.boughtAt).length;
                            return (
                                <section key={recipient.id} aria-label={`Pour ${recipient.name}`}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <RecipientAvatar recipient={recipient} />
                                        <h2 className="flex-1 min-w-0 font-semibold text-gray-800 wrap-break-word">
                                            Pour {recipient.name}
                                        </h2>
                                        <span className="shrink-0 text-xs text-gray-400">
                                            {boughtCount}/{rows.length} acheté{boughtCount > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-2">{[...rows].sort(byBoughtThenName).map(renderRow)}</div>
                                </section>
                            );
                        })}
                    </div>
                )}

                {/* ── Cadeaux personnels ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 mt-8 mb-4">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Cadeaux personnels</p>
                        <p className="text-sm text-gray-400">Visibles uniquement par toi</p>
                    </div>
                    <CustomButton variant="green" size="sm" onClick={() => setPersonalFormKey('new')}>
                        Ajouter un cadeau personnel
                    </CustomButton>
                </div>
                {personalRows.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center mb-6 shadow-xs">
                        <p className="text-3xl mb-2">📝</p>
                        <p className="text-sm text-gray-400">Aucun cadeau personnel ajouté</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 mb-6">{[...personalRows].sort(byBoughtThenName).map(renderRow)}</div>
                )}

                {/* Fiche détail */}
                {selected && !personalFormKey && (
                    <Modal
                        title={selected.name}
                        emoji={selected.kind === 'reserved' ? '🎁' : '📝'}
                        onClose={() => setSelectedKey(null)}
                        footer={
                            <div className="flex flex-wrap justify-end gap-2">
                                <CustomButton
                                    variant={selected.boughtAt ? 'slate' : 'green'}
                                    onClick={() => toggleBought(selected)}
                                    disabled={busyKey === selected.key}
                                >
                                    {selected.boughtAt ? 'Pas encore acheté' : 'Marquer comme acheté'}
                                </CustomButton>
                                {selected.kind === 'reserved' ? (
                                    <CustomButton onClick={() => releaseGift(selected)} disabled={busyKey === selected.key}>
                                        Libérer
                                    </CustomButton>
                                ) : (
                                    <>
                                        <CustomButton variant="slate" onClick={() => setPersonalFormKey(selected.key)}>
                                            Modifier
                                        </CustomButton>
                                        <CustomButton
                                            onClick={() => deletePersonalGift(selected)}
                                            disabled={busyKey === selected.key}
                                        >
                                            Supprimer
                                        </CustomButton>
                                    </>
                                )}
                                <CustomButton variant="slate" onClick={() => setSelectedKey(null)}>
                                    Fermer
                                </CustomButton>
                            </div>
                        }
                    >
                        <div className="space-y-4 text-gray-700">
                            <p className="flex items-center gap-2 text-sm text-gray-500">
                                <RecipientAvatar recipient={selected.recipient} size="sm" />
                                {selected.recipient ? `Pour ${selected.recipient.name}` : 'Pour personne en particulier'}
                                {selected.giftType === 'UNLIMITED' && (
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                        🔁 Illimité
                                    </span>
                                )}
                            </p>
                            {selected.parentName && <p className="text-sm text-gray-500">Fait partie de : {selected.parentName}</p>}
                            {selected.description ? (
                                <p className="whitespace-pre-line wrap-break-word">{selected.description}</p>
                            ) : (
                                <p className="italic">Pas de description</p>
                            )}
                            {toSafeUrl(selected.url) ? <ModernLink href={selected.url} /> : <p className="italic">Pas de lien</p>}
                            {selected.boughtAt && (
                                <p className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                                    ✓ Acheté le {new Date(selected.boughtAt).toLocaleDateString('fr-FR')}
                                    <span className="block text-xs text-green-600 mt-1">
                                        Retiré automatiquement {BOUGHT_RETENTION_MONTHS} mois après l&apos;achat
                                    </span>
                                </p>
                            )}
                        </div>
                    </Modal>
                )}

                {personalFormKey && (
                    <PersonalGiftModal
                        groupUsers={groupUsers}
                        currentUserId={connectedUser?.userId}
                        initial={
                            editedPersonal
                                ? {
                                      name: editedPersonal.name,
                                      description: editedPersonal.description ?? '',
                                      link: editedPersonal.url ?? '',
                                      forUserId: editedPersonal.recipient?.id ?? ''
                                  }
                                : undefined
                        }
                        onClose={() => setPersonalFormKey(null)}
                        onSubmit={savePersonalGift}
                    />
                )}
            </div>
        </Layout>
    );
};

export async function getServerSideProps(context: NextPageContext) {
    const userId = context.query.id?.toString() ?? '';

    const [takenGifts, personalGifts] = await Promise.all([getTakenGiftsFromUserId(userId), getPersonalGiftsByUser(userId)]);

    // Les cadeaux orphelins (sans propriétaire) n'apparaissent plus
    const reserved: TTakenRow[] = takenGifts
        .filter((gift) => gift.user !== null)
        .map((gift) => {
            const parentGift = (gift as any).parentGift as { name: string } | null;
            return {
                key: `reserved_${gift.userTakenGiftId ?? gift.id}`,
                kind: 'reserved',
                id: gift.id,
                takenGiftId: gift.userTakenGiftId ?? null,
                parentGiftId: gift.parentGiftId,
                parentName: parentGift?.name ?? null,
                name: gift.name,
                description: gift.description,
                url: gift.url,
                giftType: gift.giftType,
                recipient: { id: gift.user!.id, name: gift.user!.name },
                boughtAt: gift.boughtAt?.toISOString() ?? null
            };
        });

    return { props: { reserved, personal: personalGifts.map(toPersonalRow) } };
}

export default TakenGiftList;

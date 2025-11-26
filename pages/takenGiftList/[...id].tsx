import CustomButton from '@/components/atoms/customButton';
import { EHeader } from '@/components/customHeader';
import { Layout } from '@/components/layout';
import { getTakenGiftsFromUserId } from '@/lib/db/giftManager';
import { Gift, User } from '@prisma/client';
import { NextPageContext } from 'next';
import { useState } from 'react';
import { TGiftApiResult } from '@/pages/api/gift';
import Swal from 'sweetalert2';
import { GiftIcon } from '@/components/icons/gift';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import ModernLink from '@/components/atoms/ModernLink';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

const TakenGiftList = ({ takenGifts }: { takenGifts: (Gift & { user: User | null })[] }): JSX.Element => {
    const { connectedUser } = useCurrentUser();
    const [localTakenGifts, setLocalTakenGifts] = useState<(Gift & { user: User | null })[]>(takenGifts);
    const [formData, setFormData] = useState({
        isCreating: false,
        name: '',
        description: '',
        link: '',
        error: ''
    });

    const onUnBlockGiftClick = async (giftToUpdate: Gift): Promise<void> => {
        const result = await AxiosWrapper.put(`/api/gift/${giftToUpdate.id}`, {
            gift: {
                id: giftToUpdate.id,
                takenUserId: null
            }
        });
        const data = result?.data as TGiftApiResult;

        if (data && data.success && data.gift) {
            setLocalTakenGifts((oldGifts) => oldGifts.filter((gift) => gift.id !== giftToUpdate.id));
        } else {
            Swal.fire({
                title: 'Erreur',
                text: `Mince, ça n'a pas fonctionné: ${data?.error ?? '...'}`,
                icon: 'error'
            });
        }
    };

    const onCreatingPersonalGiftClick = (): void => {
        setFormData((prev) => ({ ...prev, isCreating: true }));
        window.setTimeout(() => document.getElementById('newGiftInputId')?.focus(), 0);
    };

    const clearAllFields = (): void => {
        setFormData({
            isCreating: false,
            name: '',
            description: '',
            link: '',
            error: ''
        });
    };

    const createPersonalGift = async (): Promise<void> => {
        if (!formData.name) {
            setFormData((prev) => ({ ...prev, error: 'Il faut rentrer un nom.' }));
            return;
        }

        const result = await AxiosWrapper.post('/api/gift', {
            gift: {
                name: formData.name,
                description: formData.description || null,
                url: formData.link || null,
                userId: null, // Pas d'utilisateur associé (cadeau personnel)
                takenUserId: connectedUser?.userId // L'utilisateur qui crée ce cadeau personnel
            }
        });
        const data = result?.data as TGiftApiResult;

        if (data && data.success && data.gift) {
            setLocalTakenGifts((oldGifts) => [
                ...oldGifts,
                {
                    ...data.gift,
                    user: null
                } as Gift & { user: User | null }
            ]);
            clearAllFields();
        } else {
            Swal.fire({
                title: 'Erreur',
                text: `Mince, ça n'a pas fonctionné: ${data?.error ?? '...'}`,
                icon: 'error'
            });
        }
    };

    const deletePersonalGift = async (giftId: string): Promise<void> => {
        const swalWithBootstrapButtons = Swal.mixin({
            buttonsStyling: true
        });

        const result = await swalWithBootstrapButtons.fire({
            title: 'Es-tu certain de vouloir supprimer ce cadeau?',
            text: 'Il ne sera pas possible de revenir en arrière!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Oui!',
            cancelButtonText: 'Non!',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            const apiResult = await AxiosWrapper.delete(`/api/gift/${giftId}`);
            const data = apiResult?.data as TGiftApiResult;

            if (data && data.success === true) {
                setLocalTakenGifts((oldGifts) => oldGifts.filter((gift) => gift.id !== giftId));
                swalWithBootstrapButtons.fire({
                    title: 'Supprimé!',
                    text: 'Le cadeau a été supprimé.',
                    icon: 'success'
                });
            } else {
                swalWithBootstrapButtons.fire({
                    title: 'Erreur!',
                    text: "Le cadeau n'a pas pu être supprimé.",
                    icon: 'error'
                });
            }
        }
    };

    return (
        <Layout selectedHeader={EHeader.TakenGiftList}>
            <div className="mb-10">
                <h1>{`Voici la liste des cadeaux que je prends:`}</h1>

                {/* Cadeaux sélectionnés depuis les listes d'autres utilisateurs */}
                <h2 className="text-2xl font-semibold mt-6 mb-4">🎁 Cadeaux réservés</h2>
                {localTakenGifts.filter((gift) => gift.user !== null).length === 0 ? (
                    <p className="text-gray-500 italic mb-6">Aucun cadeau réservé pour le moment</p>
                ) : (
                    localTakenGifts
                        .filter((gift) => gift.user !== null)
                        .map((gift, idx) => (
                            <div key={`takenGift_${idx}`} className="item flex justify-between items-center w-full">
                                <div className="w-full block">
                                    <p className="mb-2 text-xl flex">
                                        <GiftIcon className="pr-3 w-9" />
                                        <b className="pr-2">Pour:</b>
                                        {gift.user?.name}
                                    </p>
                                    <p>
                                        <b className="pr-2">Nom:</b>
                                        {gift.name}
                                    </p>

                                    {gift.description && (
                                        <p>
                                            <b className="pr-2">Description:</b>
                                            {gift.description}
                                        </p>
                                    )}

                                    {gift.url && (
                                        <div className="mt-2">
                                            <ModernLink href={gift.url} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <CustomButton onClick={() => onUnBlockGiftClick(gift)}>
                                        Je ne prends plus ce cadeau
                                    </CustomButton>
                                </div>
                            </div>
                        ))
                )}

                {/* Cadeaux personnels */}
                <h2 className="text-2xl font-semibold mt-8 mb-4">📝 Mes cadeaux personnels</h2>
                <p className="text-sm text-gray-600 mb-4">
                    Ces cadeaux ne sont visibles que par toi et ne sont pas associés à une liste d&apos;utilisateur
                </p>
                {localTakenGifts.filter((gift) => gift.user === null).length === 0 ? (
                    <p className="text-gray-500 italic mb-4">Aucun cadeau personnel</p>
                ) : (
                    localTakenGifts
                        .filter((gift) => gift.user === null)
                        .map((gift, idx) => (
                            <div key={`personalGift_${idx}`} className="item flex justify-between items-center w-full">
                                <div className="w-full block">
                                    <p className="mb-2 text-xl flex">
                                        <GiftIcon className="pr-3 w-9" />
                                        <b className="pr-2">Cadeau personnel</b>
                                    </p>
                                    <p>
                                        <b className="pr-2">Nom:</b>
                                        {gift.name}
                                    </p>

                                    {gift.description && (
                                        <p>
                                            <b className="pr-2">Description:</b>
                                            {gift.description}
                                        </p>
                                    )}

                                    {gift.url && (
                                        <div className="mt-2">
                                            <ModernLink href={gift.url} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <CustomButton onClick={() => deletePersonalGift(gift.id)}>Supprimer</CustomButton>
                                </div>
                            </div>
                        ))
                )}

                {!formData.isCreating && (
                    <CustomButton className="green-button mt-4" onClick={onCreatingPersonalGiftClick}>
                        ➕ Ajouter un cadeau personnel
                    </CustomButton>
                )}

                {formData.isCreating && (
                    <div className="block pt-3">
                        <b>Ajouter un cadeau personnel:</b>
                        <p className="text-sm text-gray-600 mb-2">
                            Ce cadeau ne sera visible que par toi et ne sera pas associé à un utilisateur
                        </p>
                        {formData.error && <p className="text-red-500">{formData.error}</p>}

                        <div className="input-group pt-3">
                            <label className="input-label">Nom (incluant la personne):</label>
                            <textarea
                                id="newGiftInputId"
                                className="input-field"
                                value={formData.name}
                                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                placeholder="Ex: Livre pour Marie"
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Description:</label>
                            <textarea
                                className="input-field"
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Lien:</label>
                            <textarea
                                className="input-field"
                                value={formData.link}
                                onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
                            />
                        </div>

                        <div className="py-2">
                            <CustomButton className="green-button" onClick={createPersonalGift} disabled={formData.name === ''}>
                                Valider
                            </CustomButton>

                            <CustomButton onClick={clearAllFields}>Annuler</CustomButton>
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

    if (Number.isNaN(userId)) {
        return {
            notFound: true
        };
    }

    const takenGifts = await getTakenGiftsFromUserId(userId);

    return {
        props: {
            takenGifts: takenGifts.map((takenGift) => ({
                ...takenGift,
                user: takenGift.user
                    ? {
                          ...takenGift.user,
                          updatedAt: takenGift.user.updatedAt?.toISOString() ?? '',
                          createdAt: takenGift.user.createdAt?.toISOString() ?? ''
                      }
                    : null,
                updatedAt: takenGift.updatedAt?.toISOString() ?? '',
                createdAt: takenGift.createdAt?.toISOString() ?? ''
            }))
        }
    };
}

export default TakenGiftList;

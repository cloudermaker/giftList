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

const TakenGiftList = ({ takenGifts }: { takenGifts: (Gift & { user: User | null })[] }): JSX.Element => {
    const [localTakenGifts, setLocalTakenGifts] = useState<(Gift & { user: User | null })[]>(takenGifts);

    const onUnBlockGiftClick = async (giftToUpdate: Gift): Promise<void> => {
        const result = await AxiosWrapper.put(`/api/gift/${giftToUpdate.id}`, {
            gift: {
                id: giftToUpdate.id,
                takenUserId: null
            }
        });
        const data = result?.data as TGiftApiResult;

        if (data.success && data.gift) {
            setLocalTakenGifts((oldGifts) => oldGifts.filter((gift) => gift.id !== giftToUpdate.id));
        } else {
            Swal.fire({
                title: 'Erreur',
                text: `Mince, ça n'a pas fonctionné: ${data.error ?? '...'}`,
                icon: 'error'
            });
        }
    };

    return (
        <Layout selectedHeader={EHeader.TakenGiftList}>
            <div className="mb-10">
                <h1>{`Voici la liste des cadeaux que je prends:`}</h1>

                {localTakenGifts.map((gift, idx) => (
                    <div key={`takenGift_${idx}`} className="item flex justify-between items-center w-full">
                        <div className="w-full block">
                            <p className="mb-2 text-xl flex">
                                <GiftIcon className="pr-3 w-9" />
                                <b className="pr-2">Pour:</b>
                                {gift.user?.name ?? 'Inconnu'}
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
                                <div className="flex">
                                    <span>{'->'}</span>
                                    <a href={gift.url}>Lien</a>
                                    <span>{'<-'}</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <CustomButton onClick={() => onUnBlockGiftClick(gift)}>Je ne prends plus ce cadeau</CustomButton>
                        </div>
                    </div>
                ))}
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
                user: {
                    ...takenGift.user,
                    updatedAt: takenGift.user?.updatedAt?.toISOString() ?? '',
                    createdAt: takenGift.user?.createdAt?.toISOString() ?? ''
                },
                updatedAt: takenGift.updatedAt?.toISOString() ?? '',
                createdAt: takenGift.createdAt?.toISOString() ?? ''
            }))
        }
    };
}

export default TakenGiftList;

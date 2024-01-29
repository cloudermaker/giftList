import { EHeader } from '@/components/customHeader';
import { Layout } from '@/components/layout';
import { getTakenGiftsFromUserId } from '@/lib/db/giftManager';
import { Gift } from '@prisma/client';
import { NextPageContext } from 'next';

const TakenGiftList = ({ takenGifts }: { takenGifts: Gift[] }): JSX.Element => {
    return (
        <Layout selectedHeader={EHeader.TakenGiftList}>
            <div className="mb-10">
                <h1>{`Voici la liste des cadeaux que je prends:`}</h1>

                {takenGifts.map((gift, idx) => (
                    <div key={`takenGift_${idx}`} className="item flex justify-between items-center w-full">
                        <div className={`w-full block`}>
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
                updatedAt: takenGift.updatedAt?.toISOString() ?? '',
                createdAt: takenGift.createdAt?.toISOString() ?? ''
            }))
        }
    };
}

export default TakenGiftList;

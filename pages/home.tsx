import { EHeader } from '@/components/customHeader';
import { Layout } from '@/components/layout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import CountDown from '../components/countDown';
import { useEffect, useState } from 'react';
import { Group } from '@prisma/client';
import { TGroupApiResult } from './api/group';
import Image from 'next/image';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';

export const Home = (): JSX.Element => {
    const { connectedUser } = useCurrentUser();
    const [group, setGroup] = useState<Group>();

    useEffect(() => {
        const fetchData = async () => {
            if (connectedUser) {
                const response = await AxiosWrapper.get(`/api/group/${connectedUser?.groupId}`);
                const groupInfoResponse = response?.data as TGroupApiResult;

                if (groupInfoResponse && groupInfoResponse.success && groupInfoResponse.group) {
                    setGroup(groupInfoResponse.group);
                } else {
                    console.error(groupInfoResponse.error ?? 'An error occured');
                }
            }
        };

        fetchData();
    }, [connectedUser]);

    return (
        <Layout selectedHeader={EHeader.Homepage}>
            <h1>
                Bienvenue sur le groupe <b>{group?.name}</b>
            </h1>

            {group?.description && <div dangerouslySetInnerHTML={{ __html: group.description }} />}

            {!group?.description && (
                <span className="text-xl">
                    Si tu es ici pour remplir ta lettre du père noël, tu es au bon endroit
                    <FontAwesomeIcon className="pl-1" icon={faWandMagicSparkles} />
                </span>
            )}

            <div className="p-10 text-center text-3xl md:text-7xl text-orange-700 mt-[6vh]">
                <div className="bg-shadow">
                    <CountDown />
                </div>
            </div>

            {group?.imageUrl && (
                <div>
                    <Image src={group.imageUrl} alt="group_image"></Image>
                </div>
            )}
        </Layout>
    );
};

export default Home;

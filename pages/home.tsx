import { EHeader } from '../components/customHeader';
import { GROUP_ID_COOKIE, Layout } from '../components/layout';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import CountDown from '../components/countDown';
import { useEffect, useState } from 'react';
import { Group } from '@prisma/client';
import axios from 'axios';
import Cookies from 'js-cookie';
import { TGroupApiResult } from './api/group';
import Image from 'next/image';

export const Home = (): JSX.Element => {
    const [group, setGroup] = useState<Group>();

    useEffect(() => {
        const fetchData = async () => {
            const groupId = Cookies.get(GROUP_ID_COOKIE) ?? '';

            const response = await axios.get(`/api/group?groupId=${groupId}`);
            const groupInfoResponse = response.data as TGroupApiResult;

            if (groupInfoResponse.success && groupInfoResponse.group) {
                setGroup(groupInfoResponse.group);
            } else {
                console.error(groupInfoResponse.error ?? 'An error occured');
            }
        };

        fetchData();
    }, []);

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

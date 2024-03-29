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
import CustomButton from '@/components/atoms/customButton';
import Swal from 'sweetalert2';

export const Home = (): JSX.Element => {
    const { connectedUser } = useCurrentUser();
    const [group, setGroup] = useState<Group>();

    const [updatingDescription, setUpdatingDescription] = useState<boolean>(false);
    const [description, setDescription] = useState<string | null>();

    const [updatingImageUrl, setUpdatingImageurl] = useState<boolean>(false);
    const [imageUrl, setImageUrl] = useState<string | null>();

    useEffect(() => {
        const fetchData = async () => {
            if (connectedUser) {
                const response = await AxiosWrapper.get(`/api/group/${connectedUser?.groupId}`);
                const groupInfoResponse = response?.data as TGroupApiResult;

                if (groupInfoResponse && groupInfoResponse.success && groupInfoResponse.group) {
                    setGroup(groupInfoResponse.group);
                }
            }
        };

        fetchData();
    }, [connectedUser]);

    const onUpdateDescriptionClick = (): void => {
        setUpdatingDescription(true);

        window.setTimeout(function () {
            document.getElementById('newDescriptionInputId')?.focus();
        }, 0);
    };

    const onUpdateImageUrlClick = (): void => {
        setUpdatingImageurl(true);

        window.setTimeout(function () {
            document.getElementById('newImageUrlId')?.focus();
        }, 0);
    };

    const updateDescription = async (): Promise<void> => {
        const response = await AxiosWrapper.put(`/api/group/${group?.id}`, {
            group: { description }
        });
        const data = response?.data as TGroupApiResult;

        if (data && data.success) {
            setGroup((value) => ({
                ...value!,
                description: description ?? ''
            }));
        } else {
            Swal.fire({
                title: 'Erreur',
                text: `Mince, ça n'a pas fonctionné: ${data?.error ?? '...'}`,
                icon: 'error'
            });
        }

        clearAllFields();
    };

    const updateImageUrl = async (): Promise<void> => {
        const response = await AxiosWrapper.put(`/api/group/${group?.id}`, {
            group: { imageUrl }
        });
        const data = response?.data as TGroupApiResult;

        if (data && data.success) {
            setGroup((value) => ({
                ...value!,
                imageUrl: imageUrl ?? ''
            }));
        } else {
            Swal.fire({
                title: 'Erreur',
                text: `Mince, ça n'a pas fonctionné: ${data?.error ?? '...'}`,
                icon: 'error'
            });
        }

        clearAllFields();
    };

    const clearAllFields = (): void => {
        setUpdatingDescription(false);
        setUpdatingImageurl(false);
    };

    return (
        <Layout selectedHeader={EHeader.Homepage}>
            <h1>
                Bienvenue sur le groupe <b>{group?.name}</b>
            </h1>

            {!group?.description && (
                <div className="text-xl">
                    Si tu es ici pour remplir ta lettre du père noël, tu es au bon endroit
                    <FontAwesomeIcon className="pl-1" icon={faWandMagicSparkles} />
                </div>
            )}

            {group?.description && !updatingDescription && <div dangerouslySetInnerHTML={{ __html: group.description }} />}

            {!updatingDescription && !!connectedUser?.isAdmin && (
                <CustomButton onClick={onUpdateDescriptionClick}>Modifier la description</CustomButton>
            )}
            {updatingDescription && !!connectedUser?.isAdmin && (
                <>
                    <textarea
                        id="newDescriptionInputId"
                        className="h-96 w-96"
                        value={description ?? group?.description ?? ''}
                        onChange={(e) => setDescription(e.target.value)}
                    />

                    <div className="flex">
                        <CustomButton onClick={updateDescription}>Valider</CustomButton>

                        <CustomButton onClick={clearAllFields}>Annuler</CustomButton>
                    </div>
                </>
            )}

            <div className="p-10 text-center text-3xl md:text-7xl text-orange-700 mt-[6vh]">
                <div className="bg-shadow">
                    <CountDown />
                </div>
            </div>

            <div className="justify-center flex">
                {group?.imageUrl && <img src={group.imageUrl} alt="group_image" className="w-96" />}
            </div>

            <div className="text-center pt-4">
                {!updatingImageUrl && !!connectedUser?.isAdmin && (
                    <CustomButton onClick={onUpdateImageUrlClick}>Modifier la photo</CustomButton>
                )}

                {updatingImageUrl && !!connectedUser?.isAdmin && (
                    <>
                        <input
                            id="newImageUrlId"
                            className="w-xl"
                            value={imageUrl ?? group?.imageUrl ?? ''}
                            onChange={(e) => setImageUrl(e.target.value)}
                        />

                        <div className="flex justify-center pt-4">
                            <CustomButton onClick={updateImageUrl}>Valider</CustomButton>

                            <CustomButton onClick={clearAllFields}>Annuler</CustomButton>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default Home;

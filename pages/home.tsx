import { EHeader } from '@/components/customHeader';
import { Layout } from '@/components/layout';
import { useEffect, useState } from 'react';
import { Group } from '@prisma/client';
import { TGroupApiResult } from './api/group';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import AxiosWrapper from '@/lib/wrappers/axiosWrapper';
import CustomButton from '@/components/atoms/customButton';
import Swal from 'sweetalert2';

export const Home = (): JSX.Element => {
    const { connectedUser } = useCurrentUser();
    const [group, setGroup] = useState<Group>();
    const [description, setDescription] = useState<string | null>();
    const [updatingDescription, setUpdatingDescription] = useState<boolean>(false);

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
        window.setTimeout(() => document.getElementById('newDescriptionInputId')?.focus(), 0);
    };

    const updateDescription = async (): Promise<void> => {
        const response = await AxiosWrapper.put(`/api/group/${group?.id}`, {
            group: { description }
        });
        const data = response?.data as TGroupApiResult;

        if (data && data.success) {
            setGroup((value: Group | undefined) => ({
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

    const clearAllFields = (): void => {
        setUpdatingDescription(false);
    };

    return (
        <Layout selectedHeader={EHeader.Homepage}>
            <div className="max-w-6xl mx-auto px-4">
                {/* Header Section with Group Name */}
                <div className="bg-white rounded-xl shadow-sm p-8 mb-8 flex items-center justify-center">
                    <div className="max-w-2xl w-full">
                        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-2">Bienvenue sur le groupe</h1>
                        <p className="text-2xl text-center text-rose-500 font-medium">{group?.name}</p>
                    </div>
                </div>

                {/* Description Section */}
                <div className="mb-8">
                    {!group?.description && !updatingDescription && (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                            <p className="text-xl text-gray-600">
                                Si tu es ici pour remplir ta liste de cadeaux, tu es au bon endroit
                            </p>
                        </div>
                    )}

                    {group?.description && !updatingDescription && (
                        <div className="bg-white rounded-xl shadow-sm p-8">
                            <div
                                dangerouslySetInnerHTML={{ __html: group.description }}
                                className="prose max-w-none text-gray-600"
                            />
                            {connectedUser?.isAdmin && (
                                <div className="mt-6 text-center">
                                    <CustomButton onClick={onUpdateDescriptionClick} className="green-button">
                                        Modifier la description
                                    </CustomButton>
                                </div>
                            )}
                        </div>
                    )}

                    {updatingDescription && (
                        <div className="bg-white rounded-xl shadow-sm p-8">
                            <textarea
                                id="newDescriptionInputId"
                                className="w-full min-h-[200px] p-4 text-gray-700 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all duration-200"
                                value={description ?? group?.description ?? ''}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Entrez votre description ici..."
                            />
                            <div className="flex justify-end space-x-4 mt-6">
                                <CustomButton
                                    onClick={clearAllFields}
                                    className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200"
                                >
                                    Annuler
                                </CustomButton>
                                <CustomButton onClick={updateDescription} className="green-button px-6 py-2.5">
                                    Valider
                                </CustomButton>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Home;

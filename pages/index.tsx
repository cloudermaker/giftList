import axios from 'axios';
import Router from 'next/router';
import Cookies from 'js-cookie';
import { useState, useEffect } from 'react';
import { GROUP_ID_COOKIE, Layout, USER_ID_COOKIE } from '../components/layout';
import { TGetOrCreateGroupAndUserResult } from './api/getOrCreateGroupAndUser';
import { CustomInput } from '../components/atoms/customInput';

export default function Index(): JSX.Element {
    const [creatingGroup, setCreatingGroup] = useState<boolean>(false);
    const [joiningGroup, setJoiningGroup] = useState<boolean>(false);

    const [groupName, setGroupName] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const groupId = Cookies.get(GROUP_ID_COOKIE) ?? '';
        const userId = Cookies.get(USER_ID_COOKIE) ?? '';

        if (groupId && userId) {
            Router.push('/home');
        }
    }, []);

    const onCreatingButtonClick = (): void => {
        setCreatingGroup(true);

        window.setTimeout(function () {
            document.getElementById('groupNameInputId')?.focus();
        }, 0);
    };

    const onJoiningButtonClick = (): void => {
        setJoiningGroup(true);

        window.setTimeout(function () {
            document.getElementById('groupNameInputId')?.focus();
        }, 0);
    };

    const onCancelButtonClick = (): void => {
        setCreatingGroup(false);
        setJoiningGroup(false);
        setGroupName('');
        setName('');
        setError('');
    };

    const onValidateButtonClick = async (): Promise<void> => {
        if (!groupName) {
            setError('Il faut rentrer une famille.');
        } else if (!name) {
            setError('Il faut rentrer un nom.');
        } else {
            const res = await axios.post('api/getOrCreateGroupAndUser', {
                groupName,
                userName: name,
                isCreating: creatingGroup
            });
            const data = res.data as TGetOrCreateGroupAndUserResult;

            if (data.success) {
                Cookies.set(GROUP_ID_COOKIE, data.groupUser?.groupId ?? '', {
                    expires: 7
                });
                Cookies.set(USER_ID_COOKIE, data.groupUser?.userId ?? '', {
                    expires: 7
                });

                Router.push('/home');
            } else {
                setError(data.error);
            }
        }
    };

    const onInputPressKey = async (keyCode: string) => {
        if (keyCode === 'Enter') {
            await onValidateButtonClick();
        }
    };

    return (
        <Layout withHeader={false}>
            <h1 className="header text-center bg-white">Bienvenue sur le site de gestion de cadeaux !!</h1>

            {!creatingGroup && !joiningGroup && (
                <div className="block text-center">
                    <h3 className="p-5 font-bold bg-shadow">Que souhaites-tu faire ?</h3>

                    <div className="block m-3">
                        <button className="p-3 mx-3" onClick={onCreatingButtonClick}>
                            Créer ma famille
                        </button>

                        <button className="p-3 mx-3 mt-3" onClick={onJoiningButtonClick}>
                            Rejoindre ma famille
                        </button>
                    </div>
                </div>
            )}

            {(creatingGroup || joiningGroup) && (
                <div className="block text-center">
                    <div className="block m-3 p-2 bg-shadow">
                        {error && <b className="text-red-500">{`Erreur: ${error}`}</b>}

                        {creatingGroup && <p className="font-bold mb-2">Pour créer ta famille:</p>}
                        {!creatingGroup && <p className="font-bold mb-2">Pour rejoindre une famille:</p>}

                        <div className="block pt-2">
                            <span className="pr-2">Entre le nom de ta famille:</span>

                            <input
                                id="groupNameInputId"
                                className="bg-transparent"
                                onChange={(e) => setGroupName(e.target.value)}
                                value={groupName}
                            />
                        </div>

                        <div className="block pt-2">
                            <span className="pr-2">Entre ton nom:</span>

                            <CustomInput id="nameInputId" className="bg-transparent" onChange={setName} value={name} onKeyDown={onInputPressKey} />
                        </div>
                    </div>

                    <div className="block m-3">
                        <button className="p-3 mx-3" onClick={onValidateButtonClick}>
                            {"C'est parti!"}
                        </button>

                        <button className="p-3 mx-3" onClick={onCancelButtonClick}>
                            {'En fait, non'}
                        </button>
                    </div>
                </div>
            )}
        </Layout>
    );
}

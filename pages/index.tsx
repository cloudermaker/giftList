import Router from 'next/router';
import { useState } from 'react';
import { Layout } from '../components/layout';
import { CustomInput } from '../components/atoms/customInput';
import CustomButton from '../components/atoms/customButton';
import { useLogin } from '@/lib/hooks/useLogin';

export default function Index(): JSX.Element {
    const { login } = useLogin();

    const [creatingGroup, setCreatingGroup] = useState<boolean>(false);
    const [joiningGroup, setJoiningGroup] = useState<boolean>(false);
    const [connectingAsAdmin, setConnectingAsAdmin] = useState<boolean>(false);

    const [groupName, setGroupName] = useState<string>('');
    const [name, setName] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');

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
        setConnectingAsAdmin(false);
        setGroupName('');
        setName('');
        setPassword('');
        setError('');
    };

    const onValidateButtonClick = async (): Promise<void> => {
        setError('');
        if (!groupName) {
            setError('Il faut rentrer un groupe.');
        } else if (!name) {
            setError('Il faut rentrer un nom.');
        } else {
            const data = await login(name, groupName, creatingGroup);

            if (data.success && data.needPassword === true) {
                setConnectingAsAdmin(true);
            } else if (data.success) {
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
            <h1 className="header text-center bg-white">Bienvenue sur le site de gestion de cadeaux</h1>

            {!creatingGroup && !joiningGroup && (
                <div className="block text-center">
                    <h3 className="p-5 font-bold bg-shadow">Que souhaites-tu faire ?</h3>

                    <div className="block m-3">
                        <CustomButton className="p-3 mx-3" onClick={onCreatingButtonClick}>
                            Créer mon groupe
                        </CustomButton>

                        <CustomButton className="p-3 mx-3 mt-3" onClick={onJoiningButtonClick}>
                            Rejoindre mon groupe
                        </CustomButton>
                    </div>
                </div>
            )}

            {(creatingGroup || joiningGroup) && (
                <div className="block text-center">
                    <div className="block m-3 p-2 bg-shadow">
                        {error && <b className="text-red-500">{`Erreur: ${error}`}</b>}

                        {creatingGroup && <p className="font-bold mb-2">Pour créer ton groupe:</p>}
                        {!creatingGroup && <p className="font-bold mb-2">Pour rejoindre un groupe:</p>}

                        <div className="block pt-2">
                            <span className="pr-2">Entre le nom de ton groupe:</span>

                            <input
                                id="groupNameInputId"
                                className="bg-transparent"
                                onChange={(e) => setGroupName(e.target.value)}
                                value={groupName}
                            />
                        </div>

                        <div className="block pt-2">
                            <span className="pr-2">Entre ton nom:</span>

                            <CustomInput
                                id="nameInputId"
                                className="bg-transparent"
                                onChange={setName}
                                value={name}
                                onKeyDown={onInputPressKey}
                            />
                        </div>

                        {connectingAsAdmin && (
                            <>
                                <div className="block pt-2">
                                    <span className="pr-2">Mot de passe:</span>

                                    <CustomInput
                                        id="passwordInputId"
                                        className="bg-transparent"
                                        onChange={setPassword}
                                        value={password}
                                        onKeyDown={onInputPressKey}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="block m-3">
                        <CustomButton className="p-3 mx-3" onClick={onValidateButtonClick}>
                            {"C'est parti!"}
                        </CustomButton>

                        <CustomButton className="p-3 mx-3" onClick={onCancelButtonClick}>
                            {'En fait, non'}
                        </CustomButton>
                    </div>
                </div>
            )}
        </Layout>
    );
}

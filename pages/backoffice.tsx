import { useState } from 'react';
import { Layout } from '@/components/layout';
import axios from 'axios';
import { EHeader } from '@/components/customHeader';
import { sanitize } from '@/lib/helpers/stringHelper';
import CustomButton from '@/components/atoms/customButton';
import { getGroups } from '@/lib/db/groupManager';
import { TGroupApiResult } from './api/group';
import { Group } from '@prisma/client';

const Backoffice = ({ groups = [] }: { groups: Group[] }): JSX.Element => {
    const [localGroups, setLocalGroups] = useState<Group[]>(groups);
    const [creatingGroup, setCreatingGroup] = useState<boolean>(false);
    const [newGroupName, setNewGroupName] = useState<string>('');

    const removeGroup = async (groupId: string): Promise<void> => {
        const confirmation = window.confirm('Es tu certain de vouloir supprimer ce groupe ?');

        if (confirmation) {
            const result = await axios.delete(`/api/group?groupId=${groupId}`);
            const data = result.data as TGroupApiResult;

            if (data.success) {
                setLocalGroups((groups) => groups.filter((group) => group.id !== groupId));
            } else {
                window.alert(data.error);
            }
        }
    };

    const addGroup = async (): Promise<void> => {
        const groupToAdd: Group = {
            id: '-1',
            name: sanitize(newGroupName),
            description: '',
            imageUrl: '',
            updatedAt: new Date(),
            createdAt: new Date()
        };

        const result = await axios.post('/api/group', {
            group: groupToAdd
        });
        const data = result.data as TGroupApiResult;

        if (data.success && data.group) {
            const newGroups = localGroups;
            newGroups.push(data.group);
            setLocalGroups(newGroups);
        } else {
            window.alert(data.error);
        }
    };

    const onCreatingGroupButtonClick = (): void => {
        setCreatingGroup(true);

        window.setTimeout(function () {
            document.getElementById('newGroupInputId')?.focus();
        }, 0);
    };

    return (
        <Layout selectedHeader={EHeader.Backoffice}>
            <h1>Bienvenue sur le Backoffice</h1>

            <h2>Groupes:</h2>
            <hr />

            {localGroups.map((group) => (
                <div className="block" key={`group_${group.id}`}>
                    <div className="flex justify-between">
                        <span>{`Name: ${group.name}`}</span>

                        <div>
                            <a href={`/group/${group.id}`}>See</a>
                            <CustomButton onClick={() => removeGroup(group.id)}>Remove</CustomButton>
                        </div>
                    </div>

                    <hr />
                </div>
            ))}

            {!creatingGroup && <CustomButton onClick={onCreatingGroupButtonClick}>Ajouter</CustomButton>}

            {creatingGroup && (
                <div>
                    <span>Ajouter un nouveau groupe:</span>
                    <input id="newGroupInputId" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />

                    <CustomButton onClick={addGroup}>Add</CustomButton>

                    <CustomButton
                        onClick={() => {
                            setNewGroupName('');
                            setCreatingGroup(false);
                        }}
                    >
                        Cancel
                    </CustomButton>
                </div>
            )}
        </Layout>
    );
};

export async function getServerSideProps() {
    const groups = await getGroups();

    return {
        props: {
            groups: groups.map((group) => ({
                ...group,
                updatedAt: group.updatedAt?.toISOString(),
                createdAt: group.createdAt?.toISOString()
            }))
        }
    };
}

export default Backoffice;

import { useState } from "react";
import { Layout } from "../../components/layout";
import { getFamilyFromId, getFamilyUsersFromFamilyId } from "../../lib/db/dbManager";
import { TFamily, TFamilyUser } from "../../lib/types/family";
import axios from 'axios';
import { EHeader } from "../../components/customHeader";
import { TRemoveUserResult } from "../api/user/removeUser";
import { NextPageContext } from "next";
import { TAddUserResult } from "../api/user/addOrUpdateUser";

const Family = ({ family, familyUsers = [] }: { family: TFamily, familyUsers: TFamilyUser[] }): JSX.Element => {
    const [localUsers, setLocalUsers] = useState<TFamilyUser[]>(familyUsers);
    const [creatingUser, setCreatingUser] = useState<boolean>(false);
    const [newUserName, setNewUserName] = useState<string>('');
    
    const removeUser = async (userId: string): Promise<void> => {
        const confirmation = window.confirm('Are you sure you want to remove this user ?');

        if (confirmation) {
            const result = await axios.post('/api/user/removeUser', { userId });
            const data = result.data as TRemoveUserResult;
    
            if (data.success === true) {
                location.reload();
            } else {
                window.alert(data.error);
            }
        }
    }

    const addUser = async (): Promise<void> => {
        const newUsers: TFamilyUser[] = localUsers;

        const userToAdd: TFamilyUser = { id: '0', name: newUserName, family_id: family.id };
        newUsers.push(userToAdd);

        const result = await axios.post('/api/user/addOrUpdateUser', { familyUser: userToAdd });
        const data = result.data as TAddUserResult;

        if (data.success === true) {
            location.reload();
        } else {
            window.alert(data.error);
        }
    }

    const onCreatingUserButtonClick = (): void => {
        setCreatingUser(true);
        
        window.setTimeout(function () { 
            document.getElementById('newUserInputId')?.focus(); 
        }, 0); 
    }

    return (
        <Layout selectedHeader={EHeader.Family}>
            <h1>{`This is the family: ${family.name}`}</h1>

            <h2>Users:</h2>
            <hr />

            {localUsers.map((user) => (
                <div className="block" key={`family_${user.id}`}>
                    <div className="flex justify-between">
                        <span>{`Name: ${user.name}`}</span>

                        <div>
                            <a href={`/giftList/${user.id}`}>See gift list</a>
                            <button onClick={() => removeUser(user.id)}>Remove user</button>
                        </div>
                    </div>

                    <hr />
                </div>
            ))}

            {!creatingUser && <button onClick={onCreatingUserButtonClick}>Add new user</button>}

            {creatingUser && 
                <div>
                    <span>Add new user:</span>
                    <input id="newUserInputId" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />

                    <button onClick={addUser}>Add</button>

                    <button onClick={() => {
                        setNewUserName("");
                        setCreatingUser(false);
                    }}>Cancel</button>
                </div>
            }
            
        </Layout>
    )
}

export async function getServerSideProps(context: NextPageContext) {
    const { query } = context;

    const familyId = query.id as string;

    if (Number.isNaN(familyId)) {
        return {
            notFound: true,
        }
    }

    const family = await getFamilyFromId(familyId);
    const familyUsers = await getFamilyUsersFromFamilyId(familyId);
    
    return {
      props: {
        family,
        familyUsers,
      },
    }
  }

export default Family;
import { useState } from "react";
import { Layout } from "../../components/layout";
import { getFamilyFromId, getFamilyUsersFromFamilyId } from "../../lib/db/dbManager";
import { TFamily, TFamilyUser } from "../../lib/types/family";
import axios from 'axios';
import { EHeader } from "../../components/customHeader";
import { TRemoveUserResult } from "../api/user/removeUser";
import { NextPageContext } from "next";
import { TAddUserResult } from "../api/user/addUser";

const Family = ({ family, familyUsers = [] }: { family: TFamily, familyUsers: TFamilyUser[] }): JSX.Element => {
    const [localFamilyUsers, setLocalFamilyUsers] = useState<TFamilyUser[]>(familyUsers);
    const [creatingFamilyUser, setCreatingFamilyUser] = useState<boolean>(false);
    const [newFamilyUserName, setNewFamilyUserName] = useState<string>('');
    
    const removeFamilyUser = async (userId: string): Promise<void> => {
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

    const addFamilyUser = async (): Promise<void> => {
        const newFamilyUsers: TFamilyUser[] = localFamilyUsers;

        const userToAdd: TFamilyUser = { id: '0', name: newFamilyUserName, familyId: family.id };
        newFamilyUsers.push(userToAdd);

        const result = await axios.post('/api/user/addUser', { familyUser: userToAdd });
        const data = result.data as TAddUserResult;

        if (data.success === true) {
            location.reload();
        } else {
            window.alert(data.error);
        }
    }

    return (
        <Layout selectedHeader={EHeader.Family}>
            <h1>{`This is the family: ${family.name}`}</h1>

            <h2>Users:</h2>
            <hr />

            {localFamilyUsers.map((user) => (
                <div className="block" key={`family_${user.id}`}>
                    <div className="flex justify-between">
                        <span>{`Name: ${user.name}`}</span>

                        <div>
                            <a href={`/giftList/${user.id}`}>See gift list</a>
                            <button onClick={() => removeFamilyUser(user.id)}>Remove user</button>
                        </div>
                    </div>

                    <hr />
                </div>
            ))}

            {!creatingFamilyUser && <button onClick={() => setCreatingFamilyUser(true)}>Add new user</button>}

            {creatingFamilyUser && 
                <div>
                    <span>Add new family user:</span>
                    <input value={newFamilyUserName} onChange={(e) => setNewFamilyUserName(e.target.value)} />

                    <button onClick={addFamilyUser}>Add</button>

                    <button onClick={() => {
                        setNewFamilyUserName("");
                        setCreatingFamilyUser(false);
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
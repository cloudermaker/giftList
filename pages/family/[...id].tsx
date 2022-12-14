import { useState } from "react";
import { Layout } from "../../components/layout";
import { getFamilyFromId, getFamilyUsersFromFamilyId } from "../../lib/db/dbManager";
import { TFamily, TFamilyUser } from "../../lib/types/family";
import axios from 'axios';
import { EHeader } from "../../components/customHeader";
import { TRemoveUserResult } from "../api/user/removeUser";
import { NextPageContext } from "next";
import { TAddUserResult } from "../api/user/addOrUpdateUser";
import { sanitize } from "../../lib/helpers/stringHelper";

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

        const userToAdd: TFamilyUser = { id: '0', name: sanitize(newUserName), family_id: family.id };
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
            <h1 className="pb-5">{`Voici la famille: ${family.name}`}</h1>

            {localUsers.map((user) => (
                <div className="item flex justify-between items-center" key={`family_${user.id}`}>
                    <span>
                        <b className="pr-2">Nom:</b>
                        {user.name}
                    </span>

                    <div>
                        <a href={`/giftList/${user.id}`}>Liste de cadeaux</a>
                        <button onClick={() => removeUser(user.id)}>Supprimer cet utilisateur</button>
                    </div>
                </div>
            ))}

            {!creatingUser && <button onClick={onCreatingUserButtonClick}>Ajouter un utilisateur</button>}

            {creatingUser && 
                <div className="pb-5 pl-3">
                    <b>Nom:</b>
                    <input id="newUserInputId" className="bg-transparent" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} />

                    <button onClick={addUser}>Ajouter</button>

                    <button onClick={() => {
                        setNewUserName("");
                        setCreatingUser(false);
                    }}>Annuler</button>
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
import { useState } from "react";
import { Layout } from "../../components/layout";
import { getFamilies, getFamilyFromId, getFamilyUsersFromFamilyId } from "../../lib/db/dbManager";
import { TFamilyUser } from "../../lib/types/family";
import axios from 'axios';
import { AppContext } from "next/app";
import { GetServerSidePropsResult, NextPageContext } from "next";
import { EHeader } from "../../components/customHeader";

const Family = ({ familyName, familyUsers = [] }: { familyName: string, familyUsers: TFamilyUser[] }): JSX.Element => {
    const [localFamilyUsers, setLocalFamilyUsers] = useState<TFamilyUser[]>(familyUsers);
    const [creatingFamilyUser, setCreatingFamilyUser] = useState<boolean>(false);
    const [newFamilyUserName, setNewFamilyUserName] = useState<string>('');
    
    const removeFamilyUser = (userId: number): void => {
        //
    }

    const addFamilyUser = (): void => {
        //
    }

    return (
        <Layout selectedHeader={EHeader.Family}>
            <h1>{`This is the family: ${familyName}`}</h1>

            <h2>Users:</h2>
            <hr />

            {localFamilyUsers.map((user) => (
                <div className="block" key={`family_${user.id}`}>
                    <div className="flex justify-between">
                        <span>{`Name: ${user.name}`}</span>

                        <div>
                            <a href={`/family/${user.id}`}>See gift list</a>
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

    const familyId = Number.parseInt(query.id as string);

    if (familyId === NaN) {
        return {
            notFound: true,
        }
    }

    const family = await getFamilyFromId(familyId);
    const familyUsers = await getFamilyUsersFromFamilyId(familyId);

    console.log(familyUsers);
    
    return {
      props: {
        familyName: family.name,
        familyUsers,
      },
    }
  }

export default Family;
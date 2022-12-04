import { useState } from "react";
import { Layout } from "../components/layout";
import { getFamilies } from "../lib/db/dbManager";
import { TFamily } from "../lib/types/family";
import axios from 'axios';
import { TAddFamilyResult } from "./api/family/addFamily";

const Backoffice = ({ families = [] }: { families: TFamily[] }): JSX.Element => {
    const [localFamilies, setLocalFamilies] = useState<TFamily[]>(families);
    const [creatingFamily, setCreatingFamily] = useState<boolean>(false);
    const [newFamilyName, setNewFamilyName] = useState<string>('');
    
    const removeFamily = (familyId: number): void => {
        setLocalFamilies(localFamilies.filter((family) => family.id !== familyId));

        // call API
    }

    const addFamily = async (): Promise<void> => {
        const newFamilyId = localFamilies.length + 1;
        const newFamilies = localFamilies;

        const familyToAdd = { id: newFamilyId, name: newFamilyName };
        newFamilies.push();

        const result = await axios.post('/api/family/addFamily', { family: familyToAdd });
        const data = result.data as TAddFamilyResult;

        console.log(data);
        if (result.data.success === true) {
            setLocalFamilies(newFamilies);
            setNewFamilyName("");
        } else {
            window.alert(data.error);
        }
    }

    return (
        <Layout>
            <h1>Welcome on backoffice</h1>

            <h2>Families:</h2>
            <hr />

            {localFamilies.map((family) => (
                <div className="block" key={`family_${family.id}`}>
                    <div className="flex justify-between">
                        <span>{`Name: ${family.name} (id: ${family.id})`}</span>

                        <div>
                            <a href={`/family/${family.id}`}>See</a>
                            <button onClick={() => removeFamily(family.id)}>Remove</button>
                        </div>
                    </div>

                    <hr />
                </div>
            ))}

            {!creatingFamily && <button onClick={() => setCreatingFamily(true)}>Add new family</button>}

            {creatingFamily && 
                <div>
                    <span>Add new family:</span>
                    <input  value={newFamilyName} onChange={(e) => setNewFamilyName(e.target.value)} />

                    <button onClick={addFamily}>Add</button>

                    <button onClick={() => {
                        setNewFamilyName("");
                        setCreatingFamily(false);
                    }}>Cancel</button>
                </div>
            }
            
        </Layout>
    )
}

export async function getStaticProps() {
    const families = await getFamilies();
    
    return {
      props: {
        families,
      },
    }
  }

export default Backoffice;
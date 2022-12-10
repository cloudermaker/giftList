import { useState } from "react";
import { Layout } from "../components/layout";
import { getFamilies } from "../lib/db/dbManager";
import { TFamily } from "../lib/types/family";
import axios from 'axios';
import { TAddFamilyResult } from "./api/family/addOrUpdateFamily";
import { EHeader } from "../components/customHeader";
import { TRemoveFamilyResult } from "./api/family/removeFamily";

const Backoffice = ({ families = [] }: { families: TFamily[] }): JSX.Element => {
    const [localFamilies] = useState<TFamily[]>(families);
    const [creatingFamily, setCreatingFamily] = useState<boolean>(false);
    const [newFamilyName, setNewFamilyName] = useState<string>('');
    
    const removeFamily = async (familyId: string): Promise<void> => {
        const confirmation = window.confirm('Are you sure you want to remove this family ?');

        if (confirmation) {
            const result = await axios.post('/api/family/removeFamily', { familyId: familyId });
            const data = result.data as TRemoveFamilyResult;
    
            if (data.success === true) {
                location.reload();
            } else {
                window.alert(data.error);
            }
        }
    }

    const addOrUpdateFamily = async (): Promise<void> => {
        const newFamilies = localFamilies;

        const familyToAdd = { id: '0', name: newFamilyName };
        newFamilies.push(familyToAdd);

        const result = await axios.post('/api/family/addOrUpdateFamily', { family: familyToAdd });
        const data = result.data as TAddFamilyResult;

        if (data.success === true) {
            location.reload();
        } else {
            window.alert(data.error);
        }
    }

    const onCreatingFamilyButtonClick = (): void => {
        setCreatingFamily(true);

        window.setTimeout(function () { 
            document.getElementById('newFamilyInputId')?.focus(); 
        }, 0); 
    }

    return (
        <Layout selectedHeader={EHeader.Backoffice}>
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

            {!creatingFamily && <button onClick={onCreatingFamilyButtonClick}>Add new family</button>}

            {creatingFamily && 
                <div>
                    <span>Add new family:</span>
                    <input id="newFamilyInputId" value={newFamilyName} onChange={(e) => setNewFamilyName(e.target.value)} />

                    <button onClick={addOrUpdateFamily}>Add</button>

                    <button onClick={() => {
                        setNewFamilyName("");
                        setCreatingFamily(false);
                    }}>Cancel</button>
                </div>
            }
            
        </Layout>
    )
}

export async function getServerSideProps() {
    const families = await getFamilies();
    
    return {
      props: {
        families,
      },
    }
  }

export default Backoffice;
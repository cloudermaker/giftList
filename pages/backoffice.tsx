import { useState } from "react";
import { Layout } from "../components/layout";
import { TFamily } from "../lib/types/family";

const Backoffice = ({ families = [] }: { families: TFamily[] }): JSX.Element => {
    const [localFamilies, setLocalFamilies] = useState<TFamily[]>(families);
    const [creatingFamily, setCreatingFamily] = useState<boolean>(false);
    const [newFamilyName, setNewFamilyName] = useState<string>('');
    
    const removeFamily = (familyId: number): void => {
        setLocalFamilies(localFamilies.filter((family) => family.id !== familyId));

        // call API
    }

    const addFamily = (): void => {
        const newFamilyId = localFamilies.length + 1;
        const newFamilies = localFamilies;

        newFamilies.push({ id: newFamilyId, name: newFamilyName });

        setLocalFamilies(newFamilies);
        setNewFamilyName("");

        // call API
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

export default Backoffice;
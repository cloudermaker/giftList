import { TFamily } from '../types/family';
const { Client } = require("pg");

export const getFamilies = async (): Promise<TFamily[]> => {
    const connection = new Client(process.env.DATABASE_URL);

    connection.connect();

    let families: TFamily[] = [];
    const query = 'select * from family';

    try {
        const res = await connection.query(query, []);
        families = res.rows as TFamily[];
    }
    catch(error) {
        console.log(error);
        throw error;
    }

    connection.end();

    return families;
}

export const addFamily = async (family: TFamily): Promise<boolean> => {
    const connection = new Client(process.env.DATABASE_URL);

    connection.connect();

    const query = `INSERT INTO family (name) VALUES ('${family.name}')`;
    
    try {
        await connection.query(query, []);
    }
    catch (error) {
        console.log(error);
        throw error;
    }
    
    connection.end()

    return true;
}

export const removeFamily = async (familyId: number): Promise<boolean> => {
    const connection = new Client(process.env.DATABASE_URL);

    connection.connect();

    const query = `DELETE FROM family WHERE ID = ${familyId}`;
    
    try {
        await connection.query(query, []);
    }
    catch(error) {
        console.log(error);
        throw error;
    }
    
    connection.end()

    return true;
}
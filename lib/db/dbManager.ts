import { TFamily, TFamilyUser } from '../types/family';
const { Client } = require("pg");

const getDbConnection = () => {
    return new Client(process.env.DATABASE_URL);
}

export const getFamilies = async (): Promise<TFamily[]> => {
    const connection = getDbConnection();

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

export const getFamilyFromId = async (familyId: number): Promise<TFamily> => {
    const connection = getDbConnection();

    connection.connect();

    let family: TFamily;
    const query = `select * from family where id = ${familyId}`;

    try {
        const res = await connection.query(query, []);
        
        console.log(res);
        if (res.rows.length === 1) {
            family = res.rows[0] as TFamily;
        } else {
            throw new Error(`Unable to find family ${familyId}`);
        }
    }
    catch(error) {
        console.log(error);
        throw error;
    }

    connection.end();

    return family;
}

export const getFamilyUsersFromFamilyId = async (familyId: number): Promise<TFamilyUser[]> => {
    const connection = getDbConnection();

    connection.connect();

    let familyUsers: TFamilyUser[] = [];
    const query = `select * from family_user where family_id = ${familyId}`;

    try {
        const res = await connection.query(query, []);
        console.log(res);
        familyUsers = res.rows as TFamilyUser[];
    }
    catch(error) {
        console.log(error);
        throw error;
    }

    connection.end();

    return familyUsers;
}

export const addFamily = async (family: TFamily): Promise<boolean> => {
    const connection = getDbConnection();

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
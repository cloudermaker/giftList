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

export const getFamilyFromId = async (familyId: string): Promise<TFamily> => {
    const connection = getDbConnection();

    connection.connect();

    let family: TFamily;
    const query = `select * from family where id = ${familyId}`;

    try {
        const res = await connection.query(query, []);
        
        console.log(query, res);
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

export const getFamilyUsersFromFamilyId = async (familyId: string): Promise<TFamilyUser[]> => {
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

export const removeFamily = async (familyId: string): Promise<boolean> => {
    const connection = new Client(process.env.DATABASE_URL);

    connection.connect();

    const query_1 = `DELETE FROM family WHERE ID = ${familyId}`;
    const query_2 = `DELETE FROM family_user WHERE family_id = ${familyId}`;
    
    try {
        await connection.query(query_1, []);
        await connection.query(query_2, []);
    }
    catch(error) {
        console.log(error);
        throw error;
    }
    
    connection.end()

    return true;
}

export const addUser = async (user: TFamilyUser): Promise<boolean> => {
    const connection = getDbConnection();

    connection.connect();

    const query = `INSERT INTO family_user (name, family_id) VALUES ('${user.name}', ${user.familyId})`;
    
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

export const removeUser = async (userId: string): Promise<boolean> => {
    const connection = new Client(process.env.DATABASE_URL);

    connection.connect();

    const query = `DELETE FROM family_user WHERE ID = ${userId}`;
    
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
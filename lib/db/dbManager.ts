import { TFamily, TFamilyUser } from '../types/family';
import { TUserGift } from '../types/gift';
const { Client } = require('pg');

const getDbConnection = () => {
    return new Client(process.env.DATABASE_URL);
};

export const getFamilies = async (): Promise<TFamily[]> => {
    const connection = getDbConnection();

    connection.connect();

    let families: TFamily[] = [];
    const query = 'select * from family';

    try {
        const res = await connection.query(query, []);
        families = res.rows as TFamily[];
    } catch (error) {
        console.log(error);
        throw error;
    }

    connection.end();

    return families;
};

export const getFamilyFromId = async (familyId: string): Promise<TFamily> => {
    const connection = getDbConnection();

    connection.connect();

    let family: TFamily;
    const query = `select * from family where id = ${familyId}`;

    try {
        const res = await connection.query(query, []);

        if (res.rows.length === 1) {
            family = res.rows[0] as TFamily;
        } else {
            throw new Error(`Unable to find family with id: ${familyId}`);
        }
    } catch (error) {
        console.log(error);
        throw error;
    }

    connection.end();

    return family;
};

export const getFamilyFromName = async (familyName: string): Promise<TFamily | null> => {
    const connection = getDbConnection();

    connection.connect();

    let family: TFamily | null = null;
    const query = `select * from family where trim(lower(name)) = '${familyName.trim().toLowerCase()}'`;

    try {
        const res = await connection.query(query, []);

        if (res.rows.length === 1) {
            family = res.rows[0] as TFamily;
        } else if (res.rows.length > 1) {
            throw new Error(`There are more than one family with name: ${familyName}`);
        }
    } catch (error) {
        console.log(error);
        throw error;
    }

    connection.end();

    return family;
};

export const getFamilyUsersFromFamilyId = async (familyId: string): Promise<TFamilyUser[]> => {
    const connection = getDbConnection();

    connection.connect();

    let familyUsers: TFamilyUser[] = [];
    const query = `select * from family_user where family_id = ${familyId}`;

    try {
        const res = await connection.query(query, []);
        familyUsers = res.rows as TFamilyUser[];
    } catch (error) {
        console.log(error);
        throw error;
    }

    connection.end();

    return familyUsers;
};

export const addOrUpdateFamily = async (family: TFamily): Promise<string | null> => {
    let familyId: string | null = null;
    const connection = getDbConnection();

    connection.connect();

    const existingQuery = `select * from family where id = '${family.id}'`;
    const insertQuery = `INSERT INTO family (name) VALUES ('${family.name.trim()}') RETURNING id`;
    const updateQuery = `UPDATE family \
                        SET name = '${family.name.trim()}' \
                        where id = ${family.id}`;

    try {
        const res = await connection.query(existingQuery, []);

        if (res.rows.length > 0) {
            await connection.query(updateQuery, []);

            familyId = res.rows[0].id;
        } else {
            const resUser = await connection.query(insertQuery, []);

            familyId = resUser.rows[0].id;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }

    connection.end();

    return familyId;
};

export const removeFamily = async (familyId: string): Promise<boolean> => {
    const connection = new Client(process.env.DATABASE_URL);

    connection.connect();

    const query_1 = `DELETE FROM family WHERE ID = ${familyId}`;
    const query_2 = `DELETE FROM family_user WHERE family_id = ${familyId}`;

    try {
        await connection.query(query_1, []);
        await connection.query(query_2, []);
    } catch (error) {
        console.log(error);
        throw error;
    }

    connection.end();

    return true;
};

export const getUserFromId = async (userId: string): Promise<TFamilyUser> => {
    const connection = getDbConnection();

    connection.connect();

    let user: TFamilyUser | null = null;
    const existingQuery = `select * from family_user where id = ${userId}`;

    try {
        const res = await connection.query(existingQuery, []);

        user = res.rows[0] as TFamilyUser;
    } catch (error) {
        console.log(error);
        throw error;
    }

    connection.end();

    return user;
};

export const getUserFromName = async (userName: string, familyId: string): Promise<TFamilyUser | null> => {
    const connection = getDbConnection();

    connection.connect();

    let user: TFamilyUser | null = null;
    const query = `select * from family_user where trim(lower(name)) = '${userName.trim().toLowerCase()}' and family_id = '${familyId}'`;

    try {
        const res = await connection.query(query, []);

        if (res.rows.length === 1) {
            user = res.rows[0] as TFamilyUser;
        } else if (res.rows.length > 1) {
            throw new Error(`There are more than one family with name: ${userName.trim()}`);
        }
    } catch (error) {
        console.log(error);
        throw error;
    }

    connection.end();

    return user;
};

export const addOrUpdateUser = async (user: TFamilyUser): Promise<string | null> => {
    let userId: string | null = null;
    const connection = getDbConnection();

    connection.connect();

    const existingQuery = `select * from family_user where id = '${user.id}'`;
    const insertQuery = `INSERT INTO family_user (name, family_id) VALUES ('${user.name.trim()}', ${user.family_id}) RETURNING id`;
    const updateQuery = `UPDATE family_user \
                        SET name = '${user.name.trim()}' \
                        where id = ${user.id}`;

    try {
        const res = await connection.query(existingQuery, []);

        if (res.rows.length > 0) {
            await connection.query(updateQuery, []);

            userId = res.rows[0].id;
        } else {
            const resUser = await connection.query(insertQuery, []);

            userId = resUser.rows[0].id;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }

    connection.end();

    return userId;
};

export const removeUser = async (userId: string): Promise<boolean> => {
    const connection = new Client(process.env.DATABASE_URL);

    connection.connect();

    const query = `DELETE FROM family_user WHERE ID = ${userId}`;

    try {
        await connection.query(query, []);
    } catch (error) {
        console.log(error);
        throw error;
    }

    connection.end();

    return true;
};

export const getUserGiftsFromUserId = async (userId: string): Promise<TUserGift[]> => {
    const connection = getDbConnection();

    connection.connect();

    const selectQuery = `select * from user_gift where owner_user_id = ${userId} order by position`;

    try {
        const res = await connection.query(selectQuery, []);

        return res.rows as TUserGift[];
    } catch (error) {
        console.log(error);
        throw error;
    } finally {
        connection.end();
    }
};

export const addOrUpdateGift = async (gift: TUserGift): Promise<string | null> => {
    let giftId: string | null = null;
    const connection = getDbConnection();

    connection.connect();

    const existingGiftQuery = `select * from user_gift where id = '${gift.id}'`;
    const insertQuery = `INSERT INTO user_gift (name, url, description, owner_user_id, taken_user_id, position)\
                   VALUES ('${gift.name}', '${gift.url}', '${gift.description}', ${gift.owner_user_id}, ${gift.taken_user_id ?? 'NULL'}, ${
                       gift.position
                   }) RETURNING id`;
    const updateQuery = `UPDATE user_gift \
                        SET name = '${gift.name}', \
                        url = '${gift.url}', \
                        description = '${gift.description}', \
                        position = '${gift.position}', \
                        taken_user_id = ${gift.taken_user_id ?? 'NULL'} \
                        where id = ${gift.id}`;
    try {
        const res = await connection.query(existingGiftQuery, []);

        if (res.rows.length > 0) {
            await connection.query(updateQuery, []);

            giftId = res.rows[0].id;
        } else {
            const resGift = await connection.query(insertQuery, []);

            giftId = resGift.rows[0].id;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }

    connection.end();

    return giftId;
};

export const updateAllPositionGift = async (gifts: TUserGift[]): Promise<string | null> => {
    let giftId: string | null = null;
    const connection = getDbConnection();

    connection.connect();

    try {
        for (let gift of gifts) {
            const updateQuery = `UPDATE user_gift SET position = ${gift.position} where id = ${gift.id}`;

            await connection.query(updateQuery);
        }
    } catch (error) {
        console.log(error);
        throw error;
    }

    connection.end();

    return giftId;
};

export const removeGift = async (giftId: string): Promise<boolean> => {
    const connection = new Client(process.env.DATABASE_URL);

    connection.connect();

    const query = `DELETE FROM user_gift WHERE id = ${giftId}`;

    try {
        await connection.query(query, []);
    } catch (error) {
        console.log(error);
        throw error;
    }

    connection.end();

    return true;
};

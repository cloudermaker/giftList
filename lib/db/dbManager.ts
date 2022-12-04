import { TFamily } from '../types/family';

const createConnection = (): any => {
    var mysql      = require('mysql');
    var connection = mysql.createConnection({
        host     : 'sql200.epizy.com',
        user     : 'epiz_33128619',
        password : 'icJETUQ79ERQOr',
        database : 'epiz_33128619_gift_list'
      });

    return connection;
}
export const getFamilies = async (): Promise<TFamily[]> => {
    const connection = createConnection();

    connection.connect();

    let families: TFamily[] = [];
    await connection.query('select * from family', (error: any, results: any, fields: any): void => {
        if (error) {
            throw error;
        }
        else {
            families = results as TFamily[];
        }
    });
    
    connection.end();

    return families;
}

export const addFamily = async (family: TFamily): Promise<boolean> => {
    const connection = createConnection();

    connection.connect();

    const query = `INSERT INTO family ('id', 'name') VALUES (${family.id}, ${family.name})`;
    await connection.query(query, (error: any, results: any, fields: any): void => {
        if (error) {
            throw error;
        }
    });
    
    connection.end();

    return true;
}
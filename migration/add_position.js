const { Pool } = require('pg');

async function addPositionColumn(client) {    
    const removeColumn = 'ALTER TABLE user_gift drop column position';
    const addColumn = 'ALTER TABLE user_gift ADD position INTEGER';

    await client.query(removeColumn);
    await client.query(addColumn);

    console.log('SUCCESS');
}

async function initAllPosition(client) {
    const getAllIndex = "select * from user_gift";
    
    const res1 = await client.query(getAllIndex);

    for (let i = 0; i < res1.rows.length; i++) {
        const setCurrentPosition = `update user_gift set position = ${i + 1} where id = '${res1.rows[i].id}'`;

        const res2 = await client.query(setCurrentPosition);

        console.log('sucess', res2.rows, setCurrentPosition);
    }

    console.log('SUCCESS');
}

async function viewAllGifts(client) {
    const getAllIndex = "select * from user_gift";
    
    const res1 = await client.query(getAllIndex);

    console.log('SUCCESS', res1.rows);
}

(async () => {
    const connectionString = 'REPLACEME';
    const pool = new Pool({
        connectionString,
        application_name: '$ docs_simplecrud_node-postgres'
    });

    console.log('Connecting to db with connection string: ');
    const client = await pool.connect();

    try {
        console.log('Initializing position column...');

        //await addPositionColumn(client);

        //await initAllPosition(client);
    } catch (error) {
        console.log(error);
    }

    console.log('Closing connection...');
    await client.end();

    // Exit program
    process.exit();
})().catch((err) => console.log(err.stack));

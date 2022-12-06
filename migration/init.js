const { Pool } = require("pg");

async function dropDatabase(client) {
  const createFamilyTableQuery = 
    "DROP TABLE IF EXISTS family";
 
  await client.query(createFamilyTableQuery);

  console.log('SUCCESS');
}

async function initDatabase(client) {
  const createFamilyTableQuery = 
    "CREATE TABLE family (\
      id SERIAL PRIMARY KEY,\
      name TEXT\
    );";
 
  await client.query(createFamilyTableQuery);

  console.log('SUCCESS');
}

(async () => {
    const connectionString = "REPLACE ME";
    const pool = new Pool({
      connectionString,
      application_name: "$ docs_simplecrud_node-postgres",
    });
  
    console.log("Connecting to db with connection string: ");
    const client = await pool.connect();
    
    try {
      console.log("Dropping tables if exists...");
      await dropDatabase(client);

      console.log("Initializing database...");
      await initDatabase(client);
    }
    catch (error) {
      console.log(error);
    }

    console.log("Closing connection...");
    await client.end()

    // Exit program
    process.exit();
  })().catch((err) => console.log(err.stack));
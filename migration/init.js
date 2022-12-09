const { Pool } = require("pg");

async function dropDatabase(client) {
   await client.query("DROP TABLE IF EXISTS family");
   await client.query("DROP TABLE IF EXISTS family_user");
   await client.query("DROP TABLE IF EXISTS user_gift");

  console.log('SUCCESS');
}

async function initDatabase(client) {
  console.log('Creating table family...');
  const createFamilyTableQuery = 
    "CREATE TABLE IF NOT EXISTS family (\
      id SERIAL PRIMARY KEY,\
      name TEXT\
    );";
 
  await client.query(createFamilyTableQuery);

  console.log('SUCCESS');

  console.log('Creating table family_user...');
  const createFamilyUserTableQuery = 
    "CREATE TABLE IF NOT EXISTS family_user (\
      id SERIAL PRIMARY KEY,\
      name TEXT,\
      family_id INTEGER\
    );";
 
  await client.query(createFamilyUserTableQuery);

  console.log('SUCCESS');

  console.log('Creating table user_gift...');
  const createGiftListTableQuery = 
    "CREATE TABLE IF NOT EXISTS user_gift (\
      user_id INTEGER NOT NULL,\
      gift_name TEXT NOT NULL,\
      gift_url TEXT,\
      owner_user_id INTEGER NOT NULL,\
      taken_user_id INTEGER\
    );";
 
  await client.query(createGiftListTableQuery);

  console.log('SUCCESS');  
}

(async () => {
    const connectionString = "postgresql://pharaon3:8tkY9Pwfacz_ZqaVNHDTUQ@hale-titan-6188.8nj.cockroachlabs.cloud:26257/defaultdb?sslmode=verify-full";
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
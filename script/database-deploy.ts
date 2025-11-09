import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

async function getSqlFiles(dir: string): Promise<string[]> {
  let sqlFiles: string[] = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      sqlFiles = sqlFiles.concat(await getSqlFiles(filePath));
    } else if (filePath.endsWith('.sql')) {
      sqlFiles.push(filePath);
    }
  }
  return sqlFiles;
}

async function executeTableFiles(
  tableDir: string,
  connection: mysql.Connection,
  dbName: string
) {
  const tableFiles = await getSqlFiles(tableDir);
  for (const filePath of tableFiles) {
    const tableName = path.basename(filePath, '.sql');
    // Check if table exists in the target database
    const [rows]: any = await connection.query(
      `SELECT COUNT(*) as count
       FROM information_schema.tables
       WHERE table_schema = ? AND table_name = ?`,
      [dbName, tableName]
    );
    if (rows[0].count > 0) {
      console.log(`Table "${tableName}" exists. Skipping ${filePath}.`);
    } else {
      const sql = fs.readFileSync(filePath, 'utf8');
      console.log(`Executing ${filePath}...`);
      await connection.query(sql);
    }
  }
}

async function executeSpFiles(spDir: string, connection: mysql.Connection) {
  const spFiles = await getSqlFiles(spDir);
  for (const filePath of spFiles) {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Executing ${filePath}...`);
    await connection.query(sql);
  }
}

async function executeInsertFiles(
  insertDir: string,
  connection: mysql.Connection
) {
  const insertFiles = await getSqlFiles(insertDir);
  for (const filePath of insertFiles) {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Executing ${filePath}...`);
    await connection.query(sql);
  }
}

async function executeDbObjects(baseDir: string) {
  console.log(
    process.env.DB_HOST,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    process.env.DATABASE
  );
  // Create a MySQL connection using environment variables
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST, // e.g. 'localhost'
    user: process.env.DB_USER, // e.g. 'root'
    password: process.env.DB_PASSWORD, // your MySQL password
    database: process.env.DATABASE, // target database name
    port: parseInt(process.env.SQL_PORT || '3306'), // default MySQL port
    multipleStatements: true, // Enable execution of multiple SQL statements
  });

  try {
    const dbName = process.env.DATABASE;
    if (!dbName) {
      throw new Error('DATABASE environment variable is missing.');
    }

    // Control execution via env vars. Defaults to true if not specified.
    const runTable = process.env.RUN_TABLE
      ? process.env.RUN_TABLE.toLowerCase() === 'true'
      : true;
    const runSp = process.env.RUN_SP
      ? process.env.RUN_SP.toLowerCase() === 'true'
      : true;
    const runInsert = process.env.RUN_INSERT
      ? process.env.RUN_INSERT.toLowerCase() === 'true'
      : true;

    if (runTable) {
      const tableDir = path.join(baseDir, 'table');
      console.log('Executing table SQL files...');
      await executeTableFiles(tableDir, connection, dbName);
    } else {
      console.log('Skipping table SQL files.');
    }

    if (runSp) {
      const spDir = path.join(baseDir, 'sp');
      console.log('Executing stored procedure SQL files...');
      await executeSpFiles(spDir, connection);
    } else {
      console.log('Skipping stored procedure SQL files.');
    }

    if (runInsert) {
      const insertDir = path.join(baseDir, 'data');
      console.log('Executing insert SQL files...');
      await executeInsertFiles(insertDir, connection);
    } else {
      console.log('Skipping insert SQL files.');
    }

    console.log('All configured database objects executed successfully.');
  } catch (error) {
    console.error('Error executing SQL files:', error);
  } finally {
    await connection.end();
  }
}

const dbFolder = path.resolve(__dirname, '../DB_SCRIPT'); // adjust relative path if needed
executeDbObjects(dbFolder)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

import { createClient, Client } from '@libsql/client';
import path from 'path';
import fs from 'fs';

type DbKey = string; // e.g., 'team_12', 'team_33_august'

const dbCache: Map<DbKey, Client> = new Map();

function getDbFilePath(key: DbKey): string {
  const dbDir = path.resolve(__dirname, 'db');
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
  return path.join(dbDir, `${key}.sqlite`);
}

export function getDbClient(key: DbKey): Client {
  if (dbCache.has(key)) {
    return dbCache.get(key)!;
  }

  const dbPath = getDbFilePath(key);
  const client = createClient({ url: `file:${dbPath}` });

  dbCache.set(key, client);
  return client;
}


// import { getDbClient } from './dbManager';

// async function uploadData(teamId: number, data: any) {
//   const dbKey = `team_${teamId}`;
//   const db = getDbClient(dbKey);

//   await db.execute(`CREATE TABLE IF NOT EXISTS uploads (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     content TEXT,
//     timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
//   )`);

//   await db.execute({
//     sql: `INSERT INTO uploads (content) VALUES (?)`,
//     args: [JSON.stringify(data)],
//   });
// }

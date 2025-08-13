import path from "path";
import fs from "fs";
import Database from "duckdb";

export type DbKey = string;

const dbCache: Map<DbKey, Database.Database> = new Map();

function getDbFilePath(key: DbKey): string {
    const dbDir = path.resolve(__dirname, "db");
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
    return path.join(dbDir, `${key}.duckdb`);
}

export function getDuckDb(key: DbKey): Database.Database {
    if (dbCache.has(key)) {
        return dbCache.get(key)!;
    }
    const dbPath = getDbFilePath(key);
    const db = new Database.Database(dbPath);
    dbCache.set(key, db);
    return db;
}

// Usage example:
// const db = getDuckDb('team_12')
// db.run('CREATE TABLE IF NOT EXISTS ...')

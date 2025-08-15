import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { DuckDBInstance } from "@duckdb/node-api";
import type { Preview, Team, User } from "./schema.ts";
import type { DuckDBConnection } from "@duckdb/node-api";
import { CREATE_TEAMS_TABLE, CREATE_USERS_TABLE } from "./schema.ts";

const TEAMS_DIR = path.resolve(process.cwd(), "data", "teams");
const AUTH_DB = path.resolve(process.cwd(), "data", "auth.duckdb");

export async function withDuckDB<T>(
    fn: (conn: DuckDBConnection) => Promise<T> | T,
    filePath: string = ":memory:",
    write: boolean = false,
): Promise<T> {
    if (filePath !== ":memory:") {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    const instance = await DuckDBInstance.fromCache(filePath, {
        "access_mode": write ? "READ_WRITE" : "READ_ONLY",
    });
    const conn = await instance.connect();
    try {
        return await fn(conn);
    } finally {
        conn.disconnectSync();
    }
}

export async function initAuthDb() {
    await withDuckDB(
        async (conn) => {
            await conn.run(CREATE_USERS_TABLE);
            await conn.run(CREATE_TEAMS_TABLE);
        }, AUTH_DB, true
    );
}

export async function writeTeamParquet(
    teamId: string,
    sheet: string,
    headers: string[],
    rows: Array<Record<string, unknown>>,
) {
    const dir = path.join(TEAMS_DIR, teamId);
    const parquetPath = path.join(dir, `${teamId}.parquet`);
    const tmpPath = parquetPath + ".tmp";
    const exists = fs.existsSync(parquetPath);

    await withDuckDB(async (conn) => {
        const stage = `stage_${Date.now()}`;
        await conn.run(getStageTableDDL(stage, headers));
        await conn.run("BEGIN");
        const stg = await conn.prepare(getInsertSQL(stage, headers));
        for (const row of rows) {
            const values = headers.map((h) => row[h] ?? null);
            stg.bind([
                sheet,
                ...values as (string | number | boolean | null)[],
            ]);
            await stg.run();
        }
        await conn.run("COMMIT");

        if (exists) {
            await conn.run(
                `COPY (
            SELECT * FROM read_parquet('${parquetPath}')
            UNION ALL
            SELECT * FROM "${stage}"
         ) TO '${tmpPath}' (FORMAT 'parquet')`,
            );
            fs.renameSync(tmpPath, parquetPath);
        } else {
            await conn.run(
                `COPY "${stage}" TO '${parquetPath}' (FORMAT 'parquet')`,
            );
        }
    });
    return { filePath: parquetPath };
}

export async function queryTeamParquet(teamId: string, whereSql = "") {
    const parquetPath = path.join(TEAMS_DIR, teamId, `${teamId}.parquet`);
    if (!fs.existsSync(parquetPath)) return [];
    return await withDuckDB(async (conn) => {
        const res = await conn.run(
            `SELECT * FROM read_parquet('${parquetPath}') ${
                whereSql ? `WHERE ${whereSql}` : ""
            }`,
        );
        const data = await res.getRowObjects();
        return data;
    });
}

export function getTeamParquetPath(teamId: string) {
    const p = path.join(TEAMS_DIR, teamId, `${teamId}.parquet`);
    return fs.existsSync(p) ? p : null;
}

export function getStageTableDDL(tableName: string, headers: string[]) {
    const cols = headers.map((h) => `"${h}" VARCHAR`).join(", ");
    return `CREATE TEMP TABLE "${tableName}" (sheet VARCHAR, ${cols})`;
}

export function getInsertSQL(tableName: string, headers: string[]) {
    const cols = headers.map((h) => `"${h}"`).join(", ");
    const qs = headers.map(() => "?").join(", ");
    return `INSERT INTO "${tableName}" (sheet, ${cols}) VALUES (?, ${qs})`;
}

export async function getUser(id: string) {
    return await withDuckDB(async (conn) => {
        const result = await conn.run(
            "SELECT * FROM users WHERE id = ?",
            [id],
        );
        const rows = await result.getRowObjects();
        return rows as unknown as User[];
    }, AUTH_DB);
}

export async function upsertUser(user: User) {
    await withDuckDB(async (conn) => {
        await conn.run(
            `INSERT INTO users (id, email, name, team_id, role) VALUES (?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET 
                email=excluded.email, name=excluded.name, 
                team_id=excluded.team_id, role=excluded.role
            `, [user.id, user.email, user.name, user.team_id, user.role],
        );
    }, AUTH_DB, true);
}

export async function getAllTeams(): Promise<Team[]> {
    return await withDuckDB(async (conn) => {
        const result = await conn.run("SELECT * FROM teams");
        const rows = await result.getRowObjects();
        return rows as unknown as Team[];
    });
}

export async function getUsersByTeam(teamId: string): Promise<User[]> {
    return await withDuckDB(async (conn) => {
        const result = await conn.run(
            "SELECT * FROM users WHERE team_id = ?", [teamId],
        );
        const rows = await result.getRowObjects();
        return rows as unknown as User[];
    }, AUTH_DB);
}

export async function getPreviewData(): Promise<Preview[]> {
    return await withDuckDB(async (conn) => {
        const result = await conn.run("SELECT * FROM preview");
        const rows = await result.getRowObjects();
        return rows as unknown as Preview[];
    });
}
import { getDuckDb } from "./duckdbManager";
import { getCreateTableSQL } from "./duckdbSchema";

// Insert a row into the DuckDB table for a given team and sheet
export async function insertFinancialRow({
    teamKey,
    tableName,
    sheet,
    headers,
    row,
}: {
    teamKey: string;
    tableName: string;
    sheet: string;
    headers: string[];
    row: Record<string, any>;
}) {
    const db = getDuckDb(teamKey);
    // Ensure table exists
    const createSQL = getCreateTableSQL(tableName, headers);
    await new Promise((resolve, reject) =>
        db.run(createSQL, (err) => err ? reject(err) : resolve(undefined))
    );
    // Insert row
    const colNames = headers.map((h) => `"${h}"`).join(", ");
    const placeholders = headers.map(() => "?").join(", ");
    const values = headers.map((h) => row[h] ?? null);
    const sql =
        `INSERT INTO "${tableName}" (sheet, ${colNames}) VALUES (?, ${placeholders})`;
    await new Promise((resolve, reject) =>
        db.run(
            sql,
            [sheet, ...values],
            (err) => err ? reject(err) : resolve(undefined),
        )
    );
}

// Usage:
// await insertFinancialRow({ teamKey, tableName: 'financial_data', sheet, headers, row })

// This schema is for dynamic table creation based on the Excel file structure.
// You will need to generate the CREATE TABLE statement at runtime based on the headers.
// The table will always include a 'sheet' column (TEXT), and later 'team' and 'version'.

export function getCreateTableSQL(
    tableName: string,
    columns: string[],
): string {
    // columns: array of Excel headers (strings)
    // All columns are TEXT for simplicity; you can infer types if needed
    const cols = columns.map((col) => `"${col}" TEXT`).join(", ");
    // Always add a 'sheet' column
    return `CREATE TABLE IF NOT EXISTS "${tableName}" (sheet TEXT, ${cols})`;
}

// Usage:
// const sql = getCreateTableSQL('financial_data', ['col1', 'col2', ...])
// db.run(sql)

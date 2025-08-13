// FinancialData Excel template and filled file schema helper for DuckDB
// This is a helper to generate CREATE TABLE SQL for a given set of columns (Excel headers)

export function getFinancialDataCreateTableSQL(tableName: string, columns: string[]): string {
  // All columns as TEXT for simplicity; you can infer types if needed
  const cols = columns.map(col => `"${col}" TEXT`).join(', ')
  // Always add a 'sheet' column
  return `CREATE TABLE IF NOT EXISTS "${tableName}" (sheet TEXT, ${cols})`
}

// Usage:
// const sql = getFinancialDataCreateTableSQL('financial_data', ['col1', 'col2', ...])
// db.run(sql)

import path from 'path'
import fs from 'fs'
import duckdb from '@duckdb/node-api'
import { getFinancialDataCreateTableSQL } from './schema/financialDataSchema'

export class FinancialDataDuckDbManager {
  private dbPath: string
  private db: InstanceType<typeof duckdb.Database>

  constructor(dbFileName: string) {
    const dbDir = path.resolve(__dirname, 'db')
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir)
    this.dbPath = path.join(dbDir, dbFileName)
    this.db = new duckdb.Database(this.dbPath)
  }

  getDatabase() {
    return this.db
  }

  async ensureTable(tableName: string, columns: string[]) {
    const sql = getFinancialDataCreateTableSQL(tableName, columns)
    await this.run(sql)
  }

  run(sql: string, params?: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params ?? [], (err: Error | null) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }

  all<T = any>(sql: string, params?: any[]): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params ?? [], (err: Error | null, rows: T[]) => {
        if (err) reject(err)
        else resolve(rows)
      })
    })
  }
}

// Usage:
// const db = new FinancialDataDuckDbManager('team_12.duckdb')
// await db.ensureTable('financial_data', ['col1', 'col2', ...])
// await db.run('INSERT INTO financial_data ...')

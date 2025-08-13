import path from 'path'
import fs from 'fs'
import duckdb from '@duckdb/node-api'
import { CREATE_USERS_TABLE, CREATE_TEAMS_TABLE } from './schema/authSchema'

export class GenericDuckDbManager {
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

// Auth DB manager instance
export const authDbManager = new GenericDuckDbManager('auth.duckdb')

// Ensure auth tables exist
;(async () => {
  await authDbManager.run(CREATE_USERS_TABLE)
  await authDbManager.run(CREATE_TEAMS_TABLE)
})()

// Usage:
// await authDbManager.run('INSERT INTO users ...')
// const users = await authDbManager.all('SELECT * FROM users')

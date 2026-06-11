import type { DbConfig } from '../config'
import type { Database } from '../types'

export function createSqliteDriver(config: DbConfig): Database {
  let connected = false

  return {
    async connect() {
      // const db = new BetterSqlite3(config.file)
      // db.pragma('journal_mode = WAL')
      // run migrations…
      connected = true
    },
    async query<T>(_sql: string, _params?: unknown[]): Promise<T[]> {
      throw new Error('sqlite driver not implemented — see src/main/db/drivers/sqlite.ts')
    },
    async exec(_sql: string, _params?: unknown[]) {
      throw new Error('sqlite driver not implemented — see src/main/db/drivers/sqlite.ts')
    },
    async close() {
      connected = false
    },
    status() {
      return { driver: 'sqlite', connected, target: config.file }
    }
  }
}

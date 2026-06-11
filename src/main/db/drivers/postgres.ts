import type { DbConfig } from '../config'
import type { Database } from '../types'

/**
 * External PostgreSQL driver — STUB.
 *
 * To make it real:
 *   1. `yarn add pg`
 *   2. `const pool = new Pool({ connectionString: config.url })`
 *   3. map query/exec onto `pool.query(...)`
 */
export function createPostgresDriver(config: DbConfig): Database {
  if (!config.url) {
    throw new Error('postgres driver requires DATABASE_URL (config.url)')
  }
  let connected = false

  return {
    async connect() {
      // const pool = new Pool({ connectionString: config.url })
      // await pool.query('select 1')
      connected = true
    },
    async query<T>(_sql: string, _params?: unknown[]): Promise<T[]> {
      throw new Error('postgres driver not implemented — see src/main/db/drivers/postgres.ts')
    },
    async exec(_sql: string, _params?: unknown[]) {
      throw new Error('postgres driver not implemented — see src/main/db/drivers/postgres.ts')
    },
    async close() {
      connected = false
    },
    status() {
      return { driver: 'postgres', connected, target: maskUrl(config.url!) }
    }
  }
}

function maskUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.password) u.password = '***'
    return u.toString()
  } catch {
    return 'postgres://…'
  }
}

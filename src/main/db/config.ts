import { app } from 'electron'
import { join } from 'path'

export type DbDriver = 'sqlite' | 'postgres'

export interface DbConfig {
  driver: DbDriver
  file: string
  url?: string
}

export function loadDbConfig(): DbConfig {
  const driver = (process.env.DB_DRIVER as DbDriver) ?? 'sqlite'
  const url = process.env.DATABASE_URL

  // In dev the repo root is cwd; once packaged, write to a user-writable dir.
  const baseDir = app.isPackaged ? app.getPath('userData') : join(process.cwd(), 'db')
  const file = process.env.SQLITE_PATH ?? join(baseDir, 'app.sqlite')

  return { driver, file, url }
}

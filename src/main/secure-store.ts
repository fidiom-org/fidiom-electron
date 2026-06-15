import { join } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'fs'
import { randomBytes } from 'crypto'
import Database from 'better-sqlite3-multiple-ciphers'
import * as argon2 from 'argon2'
import { app } from 'electron'
import { runMigrations } from './schema'
import { devDbBaseDir, devDbFilePath, devDbMetaFilePath } from './db-path'

/**
 * Master-key secured SQLite store.
 *
 * The database file is encrypted at rest (SQLCipher, via
 * better-sqlite3-multiple-ciphers). The raw 256-bit encryption key is derived
 * from the user's master key with Argon2id + a per-database salt. Nothing but
 * the salt is stored in the clear, so the data is unreadable without the master
 * key — there is no recovery path, which is why the user must save it elsewhere.
 *
 * Lifecycle: `setup` (first run) → `unlock` (subsequent runs) → `lock` /
 * `reset`. The connection is held in-process; the master key never leaves it.
 */

interface Meta {
  salt: string
  kdf: 'argon2id'
  createdAt: string
}

export interface AuthStatus {
  initialized: boolean
  unlocked: boolean
}

const ARGON2_OPTS = {
  type: argon2.argon2id,
  hashLength: 32,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1
} as const

let db: Database.Database | null = null

function baseDir(): string {
  return app.isPackaged ? app.getPath('userData') : devDbBaseDir()
}

function dbFile(): string {
  return (
    process.env.SQLITE_PATH ?? (app.isPackaged ? join(baseDir(), 'app.sqlite') : devDbFilePath())
  )
}

function metaFile(): string {
  return app.isPackaged ? join(baseDir(), 'auth.json') : devDbMetaFilePath()
}

function readMeta(): Meta | null {
  try {
    return JSON.parse(readFileSync(metaFile(), 'utf8')) as Meta
  } catch {
    return null
  }
}

function isInitialized(): boolean {
  return existsSync(dbFile()) && readMeta() !== null
}

async function deriveKey(masterKey: string, salt: Buffer): Promise<string> {
  const raw = await argon2.hash(masterKey, { ...ARGON2_OPTS, salt, raw: true })
  return raw.toString('hex')
}

function keyedConnection(hexKey: string): Database.Database {
  const conn = new Database(dbFile())
  conn.pragma(`key="x'${hexKey}'"`)
  conn.pragma('foreign_keys = ON')
  conn.prepare('SELECT count(*) FROM sqlite_master').get()
  return conn
}

async function ensureUser(conn: Database.Database, masterKey: string): Promise<void> {
  const { n } = conn.prepare('SELECT count(*) AS n FROM users').get() as {
    n: number
  }
  if (n > 0) return
  const hash = await argon2.hash(masterKey, ARGON2_OPTS)
  conn.prepare('INSERT INTO users (master_password_hash) VALUES (?)').run(hash)
}

export const connection = (): Database.Database => requireDb()

export const transaction = <T>(fn: () => T): T => {
  const conn = requireDb()
  return conn.transaction(fn)()
}

export function status(): AuthStatus {
  return { initialized: isInitialized(), unlocked: db !== null }
}

export async function setup(masterKey: string): Promise<void> {
  if (!masterKey) throw new Error('Master key is required')
  if (isInitialized()) throw new Error('A master key is already set — reset first')

  mkdirSync(baseDir(), { recursive: true })
  const salt = randomBytes(16)
  const hexKey = await deriveKey(masterKey, salt)

  const conn = keyedConnection(hexKey)
  runMigrations(conn)
  await ensureUser(conn, masterKey)

  const meta: Meta = {
    salt: salt.toString('hex'),
    kdf: 'argon2id',
    createdAt: new Date().toISOString()
  }
  writeFileSync(metaFile(), JSON.stringify(meta, null, 2))

  db = conn
}

export async function unlock(masterKey: string): Promise<boolean> {
  if (!masterKey) return false
  const meta = readMeta()
  if (!meta || !existsSync(dbFile()))
    throw new Error('No database to unlock — set a master key first')

  const hexKey = await deriveKey(masterKey, Buffer.from(meta.salt, 'hex'))
  let conn: Database.Database
  try {
    conn = keyedConnection(hexKey)
  } catch {
    db = null
    return false
  }
  runMigrations(conn)
  await ensureUser(conn, masterKey)
  db = conn
  return true
}

export function lock(): void {
  db?.close()
  db = null
}

export function reset(): void {
  lock()
  for (const f of [dbFile(), `${dbFile()}-wal`, `${dbFile()}-shm`, metaFile()]) {
    rmSync(f, { force: true })
  }
}

function requireDb(): Database.Database {
  if (!db) throw new Error('Database is locked — unlock with the master key first')
  return db
}

export function query<T = unknown>(sql: string, params: unknown[] = []): T[] {
  return requireDb()
    .prepare(sql)
    .all(...(params as never[])) as T[]
}

export function exec(sql: string, params: unknown[] = []): void {
  requireDb()
    .prepare(sql)
    .run(...(params as never[]))
}

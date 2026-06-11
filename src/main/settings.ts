import * as secureStore from './secure-store'

/**
 * App-wide key/value settings, stored in the encrypted SQLite `settings` table.
 * Used for cross-process state the main process must honour (e.g. the active
 * model) as well as renderer preferences (e.g. default currency).
 */

export const getSetting = (key: string): string | null => {
  const row = secureStore.query<{ value: string }>('SELECT value FROM settings WHERE key = ?', [
    key
  ])[0]
  return row?.value ?? null
}

export const setSetting = (key: string, value: string): void => {
  secureStore.exec(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  )
}

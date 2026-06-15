import { join } from 'path'

export const devDbBaseDir = (): string => join(process.cwd(), 'db')

export const devDbFilePath = (): string =>
  process.env.SQLITE_PATH ?? join(devDbBaseDir(), 'app.sqlite')

export const devDbMetaFilePath = (): string => join(devDbBaseDir(), 'auth.json')

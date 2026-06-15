import { existsSync } from 'fs'
import { devDbFilePath, devDbMetaFilePath } from './db-path'
import { openDatabaseFile } from './db-open'
import { seedDemoDataWithConnection } from './seed-demo'
import passwordPrompt from 'password-prompt'

const readMasterKey = async (): Promise<string> => {
  const fromEnv = process.env.MASTER_KEY?.trim()
  if (fromEnv) return fromEnv

  const fromArg = process.argv.find((arg) => arg.startsWith('--master-key='))?.split('=')[1]

  if (fromArg) return fromArg

  return await passwordPrompt('Master key: ', { method: 'hide' })
}

export const runSeed = async (masterKey: string): Promise<void> => {
  const dbFile = devDbFilePath()
  const metaFile = devDbMetaFilePath()

  if (!existsSync(dbFile) || !existsSync(metaFile)) {
    console.error(`No local database found at:\n  ${dbFile}\n  ${metaFile}`)
    console.error('Run the app once (yarn dev) and complete master-key setup first.')
    process.exit(1)
  }

  if (!masterKey) {
    console.error('Master key is required.')
    process.exit(1)
  }

  let conn
  try {
    conn = await openDatabaseFile(masterKey, dbFile, metaFile)
  } catch (error) {
    console.error('Could not unlock the database — check your master key.')
    if (process.env.DEBUG) console.error(error)
    process.exit(1)
  }

  try {
    const result = seedDemoDataWithConnection(conn)
    console.log(result.message)
  } finally {
    conn.close()
  }
}

export const runSeedCli = async (): Promise<void> => {
  const masterKey = await readMasterKey()
  await runSeed(masterKey)
}

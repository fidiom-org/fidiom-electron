#!/usr/bin/env node
import { createInterface } from 'readline'
import { existsSync } from 'fs'
import { devDbFilePath, devDbMetaFilePath } from '../src/main/db-path'
import { openDatabaseFile } from '../src/main/db-open'
import { seedDemoDataWithConnection } from '../src/main/seed-demo'

const readMasterKey = (): Promise<string> => {
  const fromEnv = process.env.MASTER_KEY?.trim()
  if (fromEnv) return Promise.resolve(fromEnv)

  const fromArg = process.argv.find((arg) => arg.startsWith('--master-key='))?.split('=')[1]
  if (fromArg) return Promise.resolve(fromArg)

  const rl = createInterface({ input: process.stdin, output: process.stderr })
  return new Promise((resolve) => {
    rl.question('Master key: ', (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

const main = async (): Promise<void> => {
  const dbFile = devDbFilePath()
  const metaFile = devDbMetaFilePath()

  if (!existsSync(dbFile) || !existsSync(metaFile)) {
    console.error('No local database found. Run the app once and complete master-key setup first.')
    process.exit(1)
  }

  const masterKey = await readMasterKey()
  if (!masterKey) {
    console.error('Master key is required.')
    process.exit(1)
  }

  let conn
  try {
    conn = await openDatabaseFile(masterKey, dbFile, metaFile)
  } catch {
    console.error('Could not unlock the database — check your master key.')
    process.exit(1)
  }

  try {
    const result = seedDemoDataWithConnection(conn)
    console.log(result.message)
    process.exit(result.inserted ? 0 : 0)
  } finally {
    conn.close()
  }
}

void main()

import { runSeedCli } from '../src/main/seed-cli'

runSeedCli().catch((error) => {
  console.error(error)
  process.exit(1)
})

import { builtinModules } from 'node:module'
import { defineConfig } from 'vite'

// Native / worker-spawning deps must stay external so they're required from
// node_modules at runtime instead of being bundled into the main process.
const external = [
  'electron',
  '@qvac/sdk',
  'better-sqlite3-multiple-ciphers',
  'argon2',
  'hyperdht',
  '@hyperswarm/dht-relay',
  'ws',
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`)
]

// Both main and preload entries are named index.ts, so pin distinct output
// filenames to avoid colliding on .vite/build/index.js. package.json "main"
// points at .vite/build/main.js. The Forge plugin honors a user build.lib.
export default defineConfig({
  build: {
    lib: {
      entry: 'src/main/index.ts',
      fileName: () => 'main.js',
      formats: ['cjs']
    },
    rollupOptions: { external }
  }
})

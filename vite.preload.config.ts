import { builtinModules } from 'node:module'
import { defineConfig } from 'vite'

const external = ['electron', ...builtinModules, ...builtinModules.map((m) => `node:${m}`)]

// Emit preload.js (not index.js) so it doesn't collide with the main bundle;
// src/main/index.ts references join(__dirname, 'preload.js').
export default defineConfig({
  build: {
    rollupOptions: {
      external,
      output: { entryFileNames: 'preload.js' }
    }
  }
})

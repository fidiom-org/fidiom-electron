import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Renderer build for Electron Forge's Vite plugin. Mirrors the old
// electron.vite.config.ts renderer block (alias + React Compiler + Tailwind v4).
export default defineConfig({
  // index.html lives in src/renderer and references /src/main.tsx, so root must
  // point there. Vite resolves build.outDir relative to root, so pin it back to
  // the project's .vite/renderer/<name> (where the main process loadFile expects
  // it: __dirname=.vite/build → ../renderer/main_window/index.html).
  root: resolve(__dirname, 'src/renderer'),
  build: {
    outDir: resolve(__dirname, '.vite/renderer/main_window')
  },
  resolve: {
    alias: {
      '@renderer': resolve(__dirname, 'src/renderer/src')
    }
  },
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler']
      }
    }),
    tailwindcss()
  ]
})

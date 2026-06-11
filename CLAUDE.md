# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An Electron + React 19 + TypeScript desktop app scaffolded from the `electron-vite` React template. Development trajectory: see [`docs/roadmap.md`](docs/roadmap.md). It has a routed UI (auth gate → dashboard) and a pluggable database layer. The longer-term feature is a local LLM chat that runs a model **on-device** through Tether's QVAC SDK (`@qvac/sdk`) — no remote inference; that chat UI lives in `src/renderer/src/App.tsx` but is currently unused (see QVAC note below).

## Commands

Package manager is **Yarn 1** (`yarn@1.22.22`). The README says `pnpm` — ignore it, use `yarn`.

```bash
yarn install            # postinstall runs electron-builder install-app-deps
yarn dev                # run app with HMR (passes --no-sandbox)
yarn start              # preview a production build (electron-vite preview)
yarn build              # typecheck + electron-vite build
yarn build:mac          # package for macOS (also :win, :linux, :unpack)

yarn lint               # oxlint
yarn lint:fix           # oxlint --fix
yarn fmt                # oxfmt (write); fmt:check for CI
yarn typecheck          # runs both node + web projects
yarn typecheck:node     # main + preload (tsconfig.node.json)
yarn typecheck:web      # renderer (tsconfig.web.json)
```

There is **no test runner configured** — no test script, framework, or test files exist.

Tooling note: linting/formatting use **oxlint + oxfmt** (Oxc), not ESLint/Prettier, despite the leftover `dbaeumer.vscode-eslint` VSCode recommendation and README. Format style: single quotes, no semicolons, no trailing commas, 100-col width.

React component conventions (arrow functions, named exports, props naming): see `.cursor/rules/react-components.mdc`.

## Architecture

Three-process Electron split, each with its own tsconfig:

- **Main** — `src/main/` (built to `out/main/index.js`, the app's `main` entry). Creates the `BrowserWindow`, opens external links via the system browser, registers IPC.
- **Preload** — `src/preload/` (`contextIsolation` on). Bridges the renderer to main via `contextBridge`, exposing `window.electron`, `window.api`, and `window.qvacAPI` (`loadModel` / `infer` / `onCompletionStream` / `unloadModel`).
- **Renderer** — `src/renderer/` (React + Tailwind v4). Entry is `src/renderer/index.html` → `/src/main.tsx`. Alias `@renderer` → `src/renderer/src`.

Tailwind v4 is wired through the `@tailwindcss/vite` plugin (see `electron.vite.config.ts`), not a `tailwind.config` file.

### Renderer layout (`src/renderer/src/`)

- `main.tsx` — entry: `createRoot` → `AuthProvider` → `RouterProvider`. (Distinct from `pages/main.tsx`.)
- `lib/router.tsx` — route table via `createHashRouter`. **HashRouter is required** because the production build loads from `file://`. Routes: `/auth` and `/reset` (public) and `/`, `/projects`, `/projects/:projectId`, `/chats`, `/chats/:chatId` (behind `ProtectedRoute`).
- `pages/` — route components: `auth.tsx` (master-key setup/unlock), `main.tsx` (dashboard).
- `features/auth/` — `AuthContext` + `ProtectedRoute` guard. **Not a mock** — it drives the real secure-store via `window.authAPI` (`status` / `setup` / `unlock` / `lock` / `reset`, IPC `auth:*` → `src/main/secure-store.ts`). Session state is `{ initialized, unlocked }` read from `authAPI.status()`; the master key unlocks the encrypted SQLite DB in the main process and never touches localStorage. `ProtectedRoute` renders the app only when `unlocked`.
- `components/ui/` (Button, Input, Card) and `components/layout/AppShell` (sidebar + topbar shell). `lib/cn.ts` is the className joiner.
- `App.tsx` — the legacy QVAC chat, not mounted by any route.

### Database layer (`src/main/db/`, main process)

The renderer never touches the DB directly — it calls `window.dbAPI` (preload) which invokes the `db:status` / `db:query` IPC channels registered in `src/main/index.ts`.

`getDb()` returns a singleton selected by `loadDbConfig()`: defaults to **local SQLite** (`db/app.sqlite` in dev, userData when packaged), or **external Postgres** when `DB_DRIVER=postgres` + `DATABASE_URL` are set. Both drivers (`drivers/sqlite.ts`, `drivers/postgres.ts`) are **stubs** implementing the `Database` interface in `types.ts` — `connect`/`status` work, but `query`/`exec` throw until a real driver (`better-sqlite3` / `pg`) is installed and wired.

## QVAC integration: relocated but not yet wired

The on-device LLM feature does not run yet:

1. The QVAC main-process handlers (`load-model` / `infer` / `unload-model`) live in **`src/main/qvac.ts`** as `registerQvacHandlers(win)` — relocated from where they were originally mis-placed (the renderer entry). They are **not called** from `src/main/index.ts`, and the `@qvac/sdk` import + SDK calls are commented out.
2. **`@qvac/sdk` is not installed** (absent from `package.json` / `node_modules`).

The IPC streaming contract (preserved in `qvac.ts` + preload `qvacAPI` + `App.tsx`): renderer calls `infer(history)`; main runs QVAC `completion({ stream: true })` and pushes each token over the `completion-stream` channel, then a final empty-string `''` sentinel to signal "done." To enable: `yarn add @qvac/sdk`, uncomment in `qvac.ts`, and call `registerQvacHandlers` from `app.whenReady()`.

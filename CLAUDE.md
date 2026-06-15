# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

An Electron + React 19 + TypeScript desktop app — a local-first AI CFO finance app. Development trajectory: see [`docs/roadmap.md`](docs/roadmap.md). It has a routed UI (auth gate → dashboard / projects / chats / settings) backed by an **encrypted SQLite store** (SQLCipher, unlocked with a master key). The core feature is an on-device LLM chat that runs a model through Tether's QVAC SDK (`@qvac/sdk`) — **no remote inference** — plus receipt vision parsing, voice (STT/TTS), and RAG, all on-device. The chat is wired and live (`src/main/llm.ts` + `features/ai-chat/`).

## Commands

Package manager is **Yarn 1** (`yarn@1.22.22`). The README says `pnpm` — ignore it, use `yarn`.

```bash
yarn install            # postinstall runs electron-rebuild (argon2 + sqlcipher) against Electron's ABI
yarn start              # electron-forge start — dev with HMR (passes --no-sandbox); yarn dev is an alias
yarn package            # electron-forge package — build the unpacked .app into out/ (no installers)
yarn make               # electron-forge make — build installers for the current platform
                        #   (add --platform=win32|linux; macOS universal is unsupported by the QVAC plugin)
yarn build              # typecheck only (Forge does the actual build via package/make)

yarn lint               # oxlint
yarn lint:fix           # oxlint --fix
yarn fmt                # oxfmt (write); fmt:check for CI
yarn typecheck          # runs both node + web projects
yarn typecheck:node     # main + preload (tsconfig.node.json)
yarn typecheck:web      # renderer (tsconfig.web.json)
```

Build toolchain is **Electron Forge** (`forge.config.js`) with `@electron-forge/plugin-vite`
(per-process Vite configs: `vite.main.config.ts`, `vite.preload.config.ts`, `vite.renderer.config.ts`)
and the `@qvac/sdk/electron-forge` plugin, which tree-shakes unused `@qvac/*` native addons and
non-target prebuilds at package time (hosts pinned in `forge.config.js`). `asar` is forced **off** by
that plugin (the QVAC Bare worker can't load addons from inside an asar), so natives ship loose in
`node_modules`; `forge.config.js`'s custom `ignore` keeps `.vite` + `package.json` + `node_modules`.
Output goes to `.vite/` (bundles) and `out/` (packaged app). There is no auto-updater.

There is **no test runner configured** — no test script, framework, or test files exist.

Tooling note: linting/formatting use **oxlint + oxfmt** (Oxc), not ESLint/Prettier, despite the leftover `dbaeumer.vscode-eslint` VSCode recommendation and README. Format style: single quotes, no semicolons, no trailing commas, 100-col width.

React component conventions (arrow functions, named exports, props naming): see `.cursor/rules/react-components.mdc`.

## Architecture

Three-process Electron split, each with its own tsconfig:

- **Main** — `src/main/` (built to `out/main/index.js`, the app's `main` entry). Creates the `BrowserWindow`, opens external links via the system browser, registers IPC.
- **Preload** — `src/preload/` (`contextIsolation` on). Bridges the renderer to main via `contextBridge`, exposing `window.electron`, `window.api`, `authAPI`, `dbAPI`, `chatAPI`, `llmAPI`, `visionAPI`, `speechAPI`, `modelsAPI`, `settingsAPI`, and `p2pAPI`.
- **Renderer** — `src/renderer/` (React + Tailwind v4). Entry is `src/renderer/index.html` → `/src/main.tsx`. Alias `@renderer` → `src/renderer/src`.

Tailwind v4 is wired through the `@tailwindcss/vite` plugin (see `electron.vite.config.ts`), not a `tailwind.config` file.

### Renderer layout (`src/renderer/src/`)

- `main.tsx` — entry: `createRoot` → `AuthProvider` → `RouterProvider`. (Distinct from `pages/main.tsx`.)
- `lib/router.tsx` — route table via `createHashRouter`. **HashRouter is required** because the production build loads from `file://`. Routes: `/auth` and `/reset` (public) and `/`, `/projects`, `/projects/:projectId`, `/projects/:projectId/plan`, `/chats`, `/chats/:chatId`, `/settings` (behind `ProtectedRoute`).
- `pages/` — route components: `auth.tsx` (master-key setup/unlock), `main.tsx` (dashboard), `projects.tsx`, `project-dashboard.tsx`, `project-plan.tsx`, `chats.tsx`, `settings.tsx`.
- `features/auth/` — `AuthContext` + `ProtectedRoute` guard. **Not a mock** — it drives the real secure-store via `window.authAPI` (`status` / `setup` / `unlock` / `lock` / `reset`, IPC `auth:*` → `src/main/secure-store.ts`). Session state is `{ initialized, unlocked }` read from `authAPI.status()`; the master key unlocks the encrypted SQLite DB in the main process and never touches localStorage. `ProtectedRoute` renders the app only when `unlocked`.
- `components/ui/` (Button, Input, Card) and `components/layout/AppShell` (sidebar + topbar shell). `lib/cn.ts` is the className joiner.

### Database layer (`src/main/secure-store.ts`, main process)

The renderer never touches the DB directly — it calls `window.dbAPI` (preload) which invokes the `db:status` / `db:query` / `db:exec` IPC channels registered in `src/main/index.ts`. Those channels delegate to `secure-store.ts`.

`secure-store.ts` is a **master-key-secured encrypted SQLite store** using `better-sqlite3-multiple-ciphers` (SQLCipher). The 256-bit encryption key is derived from the user's master key with **Argon2id** + a per-database salt; the connection is held in-process and the key never leaves it. There is **no recovery path** (lost master key = lost data). The store auto-seeds a demo user/project/accounts/categories on first unlock (`schema.ts`). RAG vectors live in the same DB (`rag_chunks`).

> The old pluggable `src/main/db/` driver abstraction (`getDb`/`loadDbConfig` + SQLite/Postgres stubs) has been **removed** — `secure-store.ts` is the only DB path. There is no external-Postgres option.

## QVAC integration (wired and live)

All AI inference runs **on-device** through `@qvac/sdk` (installed; see `package.json`). The handlers are registered from `app.whenReady()` in `src/main/index.ts`:

- **Chat** (`llm.ts`, `llm:*`) — `completion({ stream, tools })` with a multi-step tool-calling agent loop (`financial-tools.ts`), grounded by `financial-context.ts` + RAG (`rag.ts`). Streams tokens over `llm:stream`, then a final empty-string `''` sentinel.
- **Vision** (`vision.ts`, `vision:*`) — `completion` with an image attachment for receipt parsing.
- **Speech** (`speech.ts`, `speech:*`) — Whisper STT (`transcribe`) + Supertonic TTS (`textToSpeech`).
- **Embeddings / RAG** (`embeddings.ts`, `rag.ts`) — `embed` (EmbeddingGemma 300M) + cosine search.
- **Model lifecycle** (`model.ts`, `model-registry.ts`, `model-handlers.ts`, `models:*`) — one selectable multimodal model (Qwen3-VL 2B / SmolVLM2 500M / Gemma 4B) is **shared by chat and vision**; voice and embeddings use their own dedicated models. Settings → Models surfaces this via the capability map (`features/settings/ui/ModelCapabilities.tsx`).

## P2P wallet bridge (optional)

Lets the app pair with a **WDK wallet browser extension** over an encrypted P2P
channel to read accounts/balances and request signatures — it custodies **no
keys or funds**. Optional: unused ⇒ no P2P/DHT network calls.

- `src/main/p2p.ts` — framework-agnostic core (no `electron` import, so it's
  headlessly testable via `scripts/p2p-smoke.mjs`). Runs a `hyperdht` node + a
  **localhost** `@hyperswarm/dht-relay` WebSocket relay (ports 49737→49739→
  ephemeral) + a key-addressed `createServer`. The MV3 wallet can't do UDP, so it
  connects the relay over a WebSocket and reaches us by public key; the resulting
  **Noise secret-stream is end-to-end encrypted** (the relay sees only
  ciphertext). On top: length-prefixed JSON-RPC. The app is the RPC **caller**;
  the wallet answers `identify` / `getAccounts` / `getBalances` / `sign` (sign is
  popup-gated **in the wallet**). `stopP2P` must `terminate()` relay clients
  before `wss.close()` or app quit hangs.
- `src/main/p2p-handlers.ts` — IPC `p2p:start|status|pairingInfo|connections|request|ping|stop`,
  broadcasts `p2p:event` to all windows, stops on `before-quit`. Lazy start: the
  renderer calls `p2p:start` on mounting the Wallet page (idempotent).
- Renderer feature `src/renderer/src/features/wallet/` (rpc schema in
  `model/wallet-rpc.ts`, hooks in `model/use-p2p.ts`, UI in `ui/`) → page
  `/wallet` (sidebar). Shows app identity, relay address/uptime, and per-wallet
  live info (identity, latency via `p2p:ping`, balances, sign test).
- The app identity keypair is persisted at `userData/p2p/p2p-identity.json`.
- **Remote dependency:** `hyperdht` bootstraps to the public Hyperswarm DHT for
  peer discovery — declared in `remote-apis.yaml` (`hyperswarm-dht-bootstrap`).
  Adds deps `hyperdht`, `@hyperswarm/dht-relay`, `ws` (externalized natives,
  rebuilt by `install-app-deps`).

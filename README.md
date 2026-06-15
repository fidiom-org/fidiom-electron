# Fibiom — on-device AI CFO

Fibiom is a **local-first personal & business finance app** with an on-device AI
CFO assistant. All AI runs on your machine through the **Tether QVAC SDK**
(`@qvac/sdk`) — there is no remote inference and your financial data never leaves
the device. The database is an encrypted SQLite store (SQLCipher) unlocked with a
master key.

Built with Electron + React 19 + TypeScript.

---

## Hackathon submission

- **Track:** **General Purpose** — runs as a desktop app on standard consumer
  laptops/desktops (macOS / Windows / Linux), no specialised accelerator
  required. Models are auto-selected for modest hardware (defaults to a 2B VLM).
- **All AI inference and RAG go through the QVAC SDK** — see
  [QVAC usage map](#qvac-sdk-usage-map).
- **Reference hardware** this was developed/tested on (see
  `artifacts/hardware.txt` for the auto-generated proof):
  Apple M5, 10 cores, 32 GB RAM, Metal 4.
- **Minimum recommended:** 8-core CPU, **16 GB RAM**, ~6 GB free disk for model
  weights. 8 GB RAM works with the SmolVLM2 500M model selected in Settings.

### Collecting submission artifacts

```bash
yarn artifacts:info   # writes artifacts/hardware.txt + artifacts/env.txt only
yarn artifacts        # the above, then runs the app and tees a timestamped run log
```

`yarn artifacts` runs `yarn dev` and captures stdout/stderr to
`artifacts/run-<timestamp>.log`. Exercise the app (unlock → send a chat message →
scan a receipt), then press `Ctrl-C`. The log captures model load, inference,
**tool calls**, and **RAG retrieval** lines emitted by the main process. Pair the
log with a screen-recorded demo video for the full artifact set. (Run logs match
`*.log*` in `.gitignore`; upload them with your submission rather than committing.)

---

## Requirements

- **Node.js** ≥ 20 (developed on Node 23)
- **Yarn 1** (`yarn@1.22.22`) — the package manager for this repo. _(Ignore any
  mention of pnpm; use Yarn.)_
- A C/C++ toolchain for native modules (`better-sqlite3-multiple-ciphers`,
  `argon2`): Xcode Command Line Tools on macOS, build-essential on Linux,
  Visual Studio Build Tools on Windows. `yarn install` runs
  `electron-builder install-app-deps` to rebuild natives for Electron.

---

## Setup & run (reproducibility)

```bash
yarn install      # installs deps + rebuilds native modules for Electron

yarn dev          # run with HMR (passes --no-sandbox)
# or
yarn build        # typecheck + production build
yarn start        # preview the production build

# Packaging
yarn build:mac    # also :win, :linux, :unpack
```

### First run

1. Launch the app; you land on the **auth gate**. Set a **master key** — it
   derives the SQLCipher key (Argon2id). **There is no recovery path**, so store
   it safely. A demo project + seed data are created automatically.
2. Open the **AI chat** (chat FAB / Chats page) and send a message. On the first
   message the app **downloads the on-device models** (a chat/vision model and a
   small embeddings model for RAG). This is a one-time download cached locally —
   the first response is slower while it fetches and indexes.
3. Try receipt scanning from **Add transaction → upload a receipt photo**: the
   vision model parses it on-device and prefills the form.
4. Use the **mic** in the chat composer to ask by voice (Whisper STT), and
   **Listen** under any answer to hear it spoken back (Supertonic TTS). The
   voice models download on first use, like the chat model.

### Quality gates

```bash
yarn typecheck    # node (main+preload) and web (renderer) projects
yarn lint         # oxlint
yarn fmt:check    # oxfmt
```

---

## QVAC SDK usage map

Everything AI-related is funneled through `@qvac/sdk`, all in the **main process**
(`src/main/`):

| Capability                             | File                            | QVAC API                                        |
| -------------------------------------- | ------------------------------- | ----------------------------------------------- |
| **Chat inference** (CFO assistant)     | `llm.ts`                        | `completion({ stream, tools })`                 |
| **Tool-calling agent** (orchestration) | `llm.ts` + `financial-tools.ts` | `completion` with `tools`, multi-step tool loop |
| **Receipt vision parsing**             | `vision.ts`                     | `completion` with image attachment              |
| **Voice questions (STT)**              | `speech.ts`                     | `transcribe()` (Whisper)                        |
| **Spoken answers (TTS)**               | `speech.ts`                     | `textToSpeech()` (Supertonic)                   |
| **RAG embeddings**                     | `embeddings.ts`                 | `embed()` (EmbeddingGemma 300M)                 |
| **RAG retrieval**                      | `rag.ts`                        | cosine search over QVAC embeddings              |
| **Model lifecycle**                    | `model.ts`, `model-registry.ts` | `loadModel` / `unloadModel` / `getModelInfo`    |

### How the assistant answers (agentic RAG + tools)

1. `buildHistory` grounds the model with a structured financial snapshot plus the
   top semantically-retrieved records (RAG via QVAC `embed`).
2. The model is offered a **tool set** (`list_transactions`, `sum_spending`,
   `account_balances`, `list_goals`, `search_records`). It can call tools to fetch
   exact data; we execute them against the encrypted store / RAG index, feed the
   results back, and loop (capped at 5 steps) until it produces a final answer.
3. `search_records` exposes RAG itself as a tool, so the agent can run semantic
   lookups on demand.

### Models

Selectable in **Settings → Models** (`model-registry.ts`):

| Model                 | Use             | Notes                              |
| --------------------- | --------------- | ---------------------------------- |
| Qwen3-VL 2B (default) | chat + receipts | balanced quality/speed             |
| SmolVLM2 500M         | chat + receipts | smallest/fastest, low memory       |
| Gemma 4B              | chat + receipts | highest quality, larger download   |
| EmbeddingGemma 300M   | RAG embeddings  | loaded alongside the chat model    |
| Whisper base          | voice → text    | speech-to-text for voice questions |
| Supertonic (EN)       | text → voice    | spoken answers (TTS)               |

---

## Wallet connection (P2P)

Fibiom can pair with a **[WDK](https://docs.wdk.tether.io/) wallet browser
extension** over an **encrypted peer‑to‑peer channel** so the app can read your
addresses/balances and request signatures — **without custodying any keys**. The
app holds no seed and no funds; every signature is approved inside the wallet.

This is **optional**. If you never open the **Wallet** page, the app makes no
P2P/DHT network calls.

### How the channel works

The wallet runs in a Chrome MV3 service worker, which has no raw UDP sockets and
so can't be a native Hyperswarm peer. We bridge it with Holepunch's
[`@hyperswarm/dht-relay`](https://github.com/holepunchto/dht-relay):

```
WDK extension (service worker)          Fibiom (Electron main, full Node)
  dht-relay light client                  hyperdht node + key-addressed server
        │  browser WebSocket  ─────────▶   @hyperswarm/dht-relay WS relay (127.0.0.1)
        └────────── end-to-end Noise secret-stream ──────────┘
                 length-prefixed JSON-RPC over the stream
        identify · getAccounts · getBalances · sign (popup-gated)
```

- The app runs a `hyperdht` node and a **localhost‑only** WebSocket relay
  (`ws://127.0.0.1:49737`, falling back to 49738/49739). The extension connects
  the relay over a WebSocket and reaches the app by its **public key**.
- The resulting **Noise secret‑stream is end‑to‑end encrypted** — the relay sees
  only ciphertext. Peer discovery uses the public Hyperswarm DHT (declared in
  [`remote-apis.yaml`](remote-apis.yaml) as `hyperswarm-dht-bootstrap`).
- Pairing is restricted to **localhost** in this build (same‑machine scope).
- **Signing is always popup‑gated** in the wallet; the app can only _request_ it.

Code: `src/main/p2p.ts` (transport/RPC core), `src/main/p2p-handlers.ts` (IPC),
renderer feature `src/renderer/src/features/wallet/`, page `/wallet`.

### Try it

1. Open the **Wallet** page in the sidebar. Copy the **App identity** (public
   key) and **Relay address**.
2. In the WDK extension popup → **Paired apps** → paste both → **Pair**.
3. The Wallet page shows the live connection: wallet label + addresses,
   connection latency, uptime, Spark balance, and a **Sign** test that pops an
   approval in the wallet.

> The WDK wallet extension is a **separate** companion project (its own repo).
> Fibiom only needs that extension installed and unlocked to pair.

---

## Architecture

Three-process Electron split, each with its own tsconfig:

- **Main** (`src/main/`) — `BrowserWindow`, IPC, the encrypted SQLite store
  (`secure-store.ts`), **all QVAC calls**, and the **P2P wallet bridge**
  (`p2p.ts` / `p2p-handlers.ts`).
- **Preload** (`src/preload/`) — `contextBridge` exposes `window.authAPI`,
  `dbAPI`, `chatAPI`, `llmAPI`, `visionAPI`, `speechAPI`, `modelsAPI`,
  `settingsAPI`, `p2pAPI`.
- **Renderer** (`src/renderer/`) — React + Tailwind v4, hash-routed
  (auth gate → dashboard / projects / chats / settings).

Data lives in an encrypted SQLite DB (`db/app.sqlite` in dev, userData when
packaged); RAG vectors are stored in the same DB (`rag_chunks`). The renderer
never touches the DB or QVAC directly — it goes through IPC.

---

## Privacy / local-first

- On-device inference only — no network calls for AI.
- Financial data is encrypted at rest with a key derived from your master key.
- Receipt images are read on-device and never uploaded.
- The optional wallet P2P channel is **non-AI** and **end-to-end encrypted**; it
  carries no financial, receipt, or model data, and custodies no keys/funds.
  Its only remote dependency (the Hyperswarm DHT for peer discovery) is declared
  in [`remote-apis.yaml`](remote-apis.yaml).

---

## License

Licensed under the **Apache License 2.0** — see [LICENSE](LICENSE).

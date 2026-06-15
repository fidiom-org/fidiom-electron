import DHT, { type KeyPair, type SecretStream, type Server } from 'hyperdht'
import { relay } from '@hyperswarm/dht-relay'
import Stream from '@hyperswarm/dht-relay/ws'
import { WebSocketServer } from 'ws'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { randomBytes } from 'crypto'

const DEFAULT_PORTS = [49737, 49738, 49739]
const MAX_FRAME = 1024 * 1024
const REQUEST_TIMEOUT_MS = 30_000

export interface PairingInfo {
  publicKey: string
  wsUrl: string
  port: number
}

export interface ConnectionInfo {
  remoteKey: string
  connectedAt: number
  lastSeen: number
}

export interface P2PStatus extends Partial<PairingInfo> {
  running: boolean
  startedAt: number | null
  connections: ConnectionInfo[]
}

export type P2PEvent =
  | { type: 'p2p:connection'; remoteKey: string; connectedAt: number }
  | { type: 'p2p:disconnect'; remoteKey: string }
  | { type: 'p2p:walletEvent'; remoteKey: string; name: string; data: unknown }

export interface StartOptions {
  storageDir: string
  onEvent?: (event: P2PEvent) => void
}

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (err: Error) => void
  timer: ReturnType<typeof setTimeout>
}

let dht: DHT | null = null
let server: Server | null = null
let wss: WebSocketServer | null = null
let keyPair: KeyPair | null = null
let wsPort = 0
let startedAt: number | null = null
let emit: (event: P2PEvent) => void = () => {}

const sessions = new Map<string, Session>()

function encodeFrame(message: unknown): Buffer {
  const body = Buffer.from(JSON.stringify(message), 'utf8')
  const head = Buffer.allocUnsafe(4)
  head.writeUInt32BE(body.length, 0)
  return Buffer.concat([head, body])
}

class Session {
  readonly remoteKey: string
  readonly connectedAt = Date.now()
  lastSeen = Date.now()
  private buffer = Buffer.alloc(0)
  private nextId = 1
  private readonly pending = new Map<number, PendingRequest>()

  constructor(private readonly conn: SecretStream) {
    this.remoteKey = Buffer.from(conn.remotePublicKey).toString('hex')
    conn.on('data', (chunk) => this.onData(chunk))
    conn.on('error', () => {})
  }

  private onData(chunk: Buffer): void {
    this.lastSeen = Date.now()
    this.buffer = Buffer.concat([this.buffer, chunk])
    while (this.buffer.length >= 4) {
      const len = this.buffer.readUInt32BE(0)
      if (len > MAX_FRAME) {
        this.conn.destroy(new Error('frame exceeds maximum size'))
        return
      }
      if (this.buffer.length < 4 + len) break
      const payload = this.buffer.subarray(4, 4 + len)
      this.buffer = this.buffer.subarray(4 + len)
      this.handleMessage(payload)
    }
  }

  private handleMessage(payload: Buffer): void {
    let message: Record<string, unknown>
    try {
      message = JSON.parse(payload.toString('utf8'))
    } catch {
      return
    }

    if (typeof message.id === 'number' && ('result' in message || 'error' in message)) {
      const waiter = this.pending.get(message.id)
      if (!waiter) return
      this.pending.delete(message.id)
      clearTimeout(waiter.timer)
      if (typeof message.error === 'string') waiter.reject(new Error(message.error))
      else waiter.resolve(message.result)
      return
    }

    if (typeof message.event === 'string') {
      emit({
        type: 'p2p:walletEvent',
        remoteKey: this.remoteKey,
        name: message.event,
        data: message.data
      })
      return
    }

    if (typeof message.method === 'string') {
      const id = typeof message.id === 'number' ? message.id : null
      if (message.method === 'ping') {
        if (id !== null) this.send({ id, result: { pong: true, ts: Date.now() } })
      } else if (id !== null) {
        this.send({ id, error: `method not implemented: ${message.method}` })
      }
    }
  }

  private send(message: unknown): void {
    this.conn.write(encodeFrame(message))
  }

  request(method: string, params: unknown, timeoutMs = REQUEST_TIMEOUT_MS): Promise<unknown> {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`p2p request timed out: ${method}`))
      }, timeoutMs)
      this.pending.set(id, { resolve, reject, timer })
      this.send({ id, method, params })
    })
  }

  rejectAllPending(reason: string): void {
    for (const [, waiter] of this.pending) {
      clearTimeout(waiter.timer)
      waiter.reject(new Error(reason))
    }
    this.pending.clear()
  }

  destroy(): void {
    this.conn.destroy()
  }
}

function loadOrCreateKeyPair(storageDir: string): KeyPair {
  mkdirSync(storageDir, { recursive: true })
  const file = join(storageDir, 'p2p-identity.json')
  let seed: Buffer
  if (existsSync(file)) {
    seed = Buffer.from(JSON.parse(readFileSync(file, 'utf8')).seed, 'hex')
  } else {
    seed = randomBytes(32)
    writeFileSync(file, JSON.stringify({ seed: seed.toString('hex') }), { mode: 0o600 })
  }
  return DHT.keyPair(seed)
}

function listenWss(port: number): Promise<WebSocketServer> {
  return new Promise((resolve, reject) => {
    const candidate = new WebSocketServer({ host: '127.0.0.1', port })
    const onError = (err: NodeJS.ErrnoException): void => reject(err)
    candidate.once('error', onError)
    candidate.once('listening', () => {
      candidate.off('error', onError)
      resolve(candidate)
    })
  })
}

async function startRelay(node: DHT): Promise<WebSocketServer> {
  for (const port of [...DEFAULT_PORTS, 0]) {
    try {
      const relayServer = await listenWss(port)
      relayServer.on('connection', (socket) => {
        void relay(node, new Stream(false, socket))
      })
      return relayServer
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EADDRINUSE') throw err
    }
  }
  throw new Error('could not bind a WebSocket relay port')
}

export async function startP2P(options: StartOptions): Promise<PairingInfo> {
  if (dht) return getPairingInfo() as PairingInfo
  emit = options.onEvent ?? (() => {})
  keyPair = loadOrCreateKeyPair(options.storageDir)

  const node = new DHT()
  dht = node

  const srv = node.createServer((conn) => {
    const session = new Session(conn)
    sessions.set(session.remoteKey, session)
    emit({ type: 'p2p:connection', remoteKey: session.remoteKey, connectedAt: session.connectedAt })
    conn.on('close', () => {
      session.rejectAllPending('connection closed')
      sessions.delete(session.remoteKey)
      emit({ type: 'p2p:disconnect', remoteKey: session.remoteKey })
    })
  })
  server = srv
  await srv.listen(keyPair)

  wss = await startRelay(node)
  wsPort = (wss.address() as { port: number }).port
  startedAt = Date.now()

  return getPairingInfo() as PairingInfo
}

export async function stopP2P(): Promise<void> {
  for (const session of sessions.values()) session.destroy()
  sessions.clear()
  if (wss) {
    for (const client of wss.clients) client.terminate()
    const relayServer = wss
    await new Promise<void>((resolve) => relayServer.close(() => resolve()))
  }
  if (server) await server.close()
  if (dht) await dht.destroy()
  dht = null
  server = null
  wss = null
  wsPort = 0
  startedAt = null
}

export function getPairingInfo(): PairingInfo | null {
  if (!keyPair || !wsPort) return null
  return {
    publicKey: Buffer.from(keyPair.publicKey).toString('hex'),
    wsUrl: `ws://127.0.0.1:${wsPort}`,
    port: wsPort
  }
}

export function listConnections(): ConnectionInfo[] {
  return [...sessions.values()].map((s) => ({
    remoteKey: s.remoteKey,
    connectedAt: s.connectedAt,
    lastSeen: s.lastSeen
  }))
}

export function getStatus(): P2PStatus {
  const pairing = getPairingInfo()
  return {
    running: dht !== null,
    startedAt,
    publicKey: pairing?.publicKey,
    wsUrl: pairing?.wsUrl,
    port: pairing?.port,
    connections: listConnections()
  }
}

export function p2pRequest(
  remoteKey: string,
  method: string,
  params: unknown,
  timeoutMs?: number
): Promise<unknown> {
  const session = sessions.get(remoteKey)
  if (!session) throw new Error(`no connected wallet for key ${remoteKey}`)
  return session.request(method, params, timeoutMs)
}

export async function p2pPing(remoteKey: string): Promise<number> {
  const session = sessions.get(remoteKey)
  if (!session) throw new Error(`no connected wallet for key ${remoteKey}`)
  const started = Date.now()
  await session.request('ping', null, 10_000)
  return Date.now() - started
}

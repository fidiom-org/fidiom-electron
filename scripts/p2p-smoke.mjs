import { startP2P, stopP2P, listConnections, p2pRequest } from '../src/main/p2p.ts'
import RelayDHT from '@hyperswarm/dht-relay'
import RelayStream from '@hyperswarm/dht-relay/ws'
import WebSocket from 'ws'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const frame = (obj) => {
  const body = Buffer.from(JSON.stringify(obj))
  const head = Buffer.alloc(4)
  head.writeUInt32BE(body.length, 0)
  return Buffer.concat([head, body])
}

function fail(msg) {
  console.error('FAIL:', msg)
  process.exit(1)
}

function walletSession(conn) {
  let buf = Buffer.alloc(0)
  let nextId = 1
  const pending = new Map()

  conn.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk])
    while (buf.length >= 4) {
      const len = buf.readUInt32BE(0)
      if (buf.length < 4 + len) break
      const msg = JSON.parse(buf.subarray(4, 4 + len).toString())
      buf = buf.subarray(4 + len)

      if (typeof msg.method === 'string' && typeof msg.id === 'number') {
        // request from the app → echo the params back
        conn.write(
          frame({
            id: msg.id,
            result: { echoed: msg.params, method: msg.method }
          })
        )
      } else if (typeof msg.id === 'number' && ('result' in msg || 'error' in msg)) {
        const w = pending.get(msg.id)
        if (w) {
          pending.delete(msg.id)
          if (msg.error) w.reject(new Error(msg.error))
          else w.resolve(msg.result)
        }
      }
    }
  })

  return {
    request: (method, params) =>
      new Promise((resolve, reject) => {
        const id = nextId++
        pending.set(id, { resolve, reject })
        conn.write(frame({ id, method, params }))
      })
  }
}

async function main() {
  const storageDir = mkdtempSync(join(tmpdir(), 'p2p-smoke-'))
  const pairing = await startP2P({ storageDir })
  console.log('[core] started:', pairing.wsUrl, 'key', pairing.publicKey.slice(0, 16), '…')

  const socket = new WebSocket(pairing.wsUrl)
  const dht = new RelayDHT(new RelayStream(true, socket))
  const conn = dht.connect(Buffer.from(pairing.publicKey, 'hex'))

  await new Promise((resolve, reject) => {
    conn.on('open', resolve)
    conn.on('error', reject)
    setTimeout(() => reject(new Error('connect timeout')), 15000)
  })
  const wallet = walletSession(conn)
  console.log('[wallet] secret-stream open')

  await new Promise((r) => setTimeout(r, 200))
  const conns = listConnections()
  if (conns.length !== 1) fail(`core should see 1 connection, saw ${conns.length}`)
  const remoteKey = conns[0].remoteKey
  console.log('[core] sees wallet', remoteKey.slice(0, 16), '…')

  const a = await wallet.request('ping', null)
  if (!a || a.pong !== true) fail(`wallet→core ping bad response: ${JSON.stringify(a)}`)
  console.log('[A] wallet→core ping OK:', JSON.stringify(a))

  const b = await p2pRequest(remoteKey, 'echo', { x: 42 })
  if (!b || b.echoed?.x !== 42 || b.method !== 'echo')
    fail(`core→wallet echo bad: ${JSON.stringify(b)}`)
  console.log('[B] core→wallet echo OK:', JSON.stringify(b))

  conn.destroy()
  await new Promise((r) => setTimeout(r, 300))
  if (listConnections().length !== 0) fail('core still shows a connection after disconnect')
  console.log('[C] disconnect cleanup OK')

  await stopP2P()
  console.log(
    '\nPASS — Phase 1 transport works end-to-end (framing + RPC both directions + lifecycle)'
  )
  process.exit(0)
}

main().catch((err) => fail(err.stack || err.message))

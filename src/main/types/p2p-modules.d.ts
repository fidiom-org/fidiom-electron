declare module 'hyperdht' {
  export interface KeyPair {
    publicKey: Buffer
    secretKey: Buffer
  }
  export interface SecretStream {
    remotePublicKey: Buffer
    write(data: Buffer): boolean
    destroy(err?: Error): void
    on(event: 'data', cb: (chunk: Buffer) => void): this
    on(event: 'close', cb: () => void): this
    on(event: 'error', cb: (err: Error) => void): this
  }
  export interface Server {
    listen(keyPair: KeyPair): Promise<void>
    close(): Promise<void>
  }
  export default class DHT {
    constructor(opts?: Record<string, unknown>)
    static keyPair(seed?: Buffer): KeyPair
    createServer(onconnection?: (conn: SecretStream) => void): Server
    connect(publicKey: Buffer, opts?: Record<string, unknown>): SecretStream
    destroy(): Promise<void>
  }
}

declare module '@hyperswarm/dht-relay' {
  const DHT: unknown
  export default DHT
  export function relay(dht: unknown, stream: unknown): Promise<unknown>
}

declare module '@hyperswarm/dht-relay/ws' {
  export default class Stream {
    constructor(isInitiator: boolean, socket: unknown)
  }
}

export interface Database {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>

  exec(sql: string, params?: unknown[]): Promise<void>

  connect(): Promise<void>

  close(): Promise<void>

  status(): { driver: string; connected: boolean; target: string }
}

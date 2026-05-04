/**
 * Cloudflare Workers Environment Type Definitions
 */

export interface Env {
  DB: D1Database
  JWT_SECRET?: string
  KV?: KVNamespace
}

export interface D1Database {
  prepare(sql: string): Statement
  batch(statements: Statement[]): Promise<void>
}

export interface Statement {
  bind(...values: Array<string | number | null>): Statement
  first<T = any>(): Promise<T | null>
  all<T = any>(): Promise<T[]>
  run(): Promise<D1Result>
}

export interface D1Result {
  meta: D1Meta
  results?: any[]
}

export interface D1Meta {
  duration: number
  last_row_id: number | null
  rows_read: number
  rows_written: number
  changed_db: boolean
  changes: number | null
}

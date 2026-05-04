/**
 * Data Migration Script
 * Migrates localStorage data to D1 database
 */

import type {
  LocalStorageData,
  DailyMetrics,
  MetricUpdate,
} from './schema'
import * as queries from './queries'

// ============================================
// Migration Functions
// ============================================

export async function migrateLocalStorage(
  db: D1Database,
  localData: LocalStorageData
): Promise<{
  usersMigrated: number
  storesMigrated: number
  metricsMigrated: number
  updatesMigrated: number
}> {
  let usersMigrated = 0
  let storesMigrated = 0
  let metricsMigrated = 0
  let updatesMigrated = 0

  try {
    // 1. Migrate Users
    for (const user of localData.users) {
      const existing = await queries.getUserByEmail(db, user.email)
      if (!existing) {
        await queries.createUser(db, {
          email: user.email,
          name: user.name,
          password: user.password, // In production, this should be hashed
          role: (user.role as any) || 'viewer',
        })
        usersMigrated++
      }
    }

    // 2. Migrate Stores
    const createdUser = await queries.getUserByEmail(db, localData.users[0]?.email || '')
    const createdUserId = createdUser?.id || ''

    for (const store of localData.stores) {
      const existing = await queries.getStoreById(db, store.id)
      if (!existing) {
        await queries.createStore(db, {
          name: store.name,
          etsy_url: store.etsy_url || undefined,
          logo_emoji: store.logo_emoji,
          created_by: createdUserId,
        })
        storesMigrated++

        // Add the creator as admin member
        const user = await queries.getUserByEmail(db, localData.users[0]?.email || '')
        if (user) {
          const memberId = crypto.randomUUID()
          await db
            .prepare(
              `INSERT INTO store_members (id, store_id, user_id, role, joined_at)
               VALUES (?, ?, ?, 'admin', ?)`
            )
            .bind(memberId, store.id, user.id, new Date().toISOString())
            .run()
        }
      }
    }

    // 3. Migrate Metrics
    for (const [storeId, dateMetrics] of Object.entries(localData.metrics)) {
      for (const [date, metrics] of Object.entries(dateMetrics)) {
        const existing = await queries.getMetrics(db, storeId, date)
        if (!existing) {
          await queries.createOrUpdateMetrics(db, {
            store_id: storeId,
            date,
            ...metrics,
            updated_by: createdUserId,
          })
          metricsMigrated++
        }
      }
    }

    // 4. Migrate Metric Updates (History)
    for (const update of localData.metricHistory) {
      const existing = await queries.getMetricHistory(db, update.storeId)
      const existingById = existing.find(u => u.id === update.id)
      if (!existingById) {
        const user = await queries.getUserByEmail(db, localData.users[0]?.email || '')
        if (user) {
          await queries.createMetricUpdate(db, {
            store_id: update.storeId,
            metric_type: update.metric as any,
            previous_value: update.previousValue || null,
            added_value: update.addedValue,
            new_value: update.newValue,
            updated_by: user.id,
          })
          updatesMigrated++
        }
      }
    }

    return {
      usersMigrated,
      storesMigrated,
      metricsMigrated,
      updatesMigrated,
    }
  } catch (error) {
    console.error('Migration error:', error)
    throw error
  }
}

export async function getLocalStorageData(): Promise<LocalStorageData> {
  // This would typically be provided via API or file upload
  // For now, returning empty structure
  return {
    user: null,
    users: [],
    stores: [],
    selectedStoreId: '',
    metrics: {},
    metricHistory: [],
    teamMembers: [],
    activity: [],
  }
}

// ============================================
// Schema Initialization
// ============================================

export async function initializeDatabase(db: D1Database): Promise<void> {
  const schema = `
-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'viewer',
  avatar_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Stores Table
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  etsy_url TEXT,
  logo_emoji TEXT DEFAULT '🏪',
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Store Members Table
CREATE TABLE IF NOT EXISTS store_members (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT DEFAULT 'viewer',
  invited_by TEXT,
  joined_at TEXT DEFAULT (datetime('now')),
  UNIQUE(store_id, user_id)
);

-- Daily Metrics Table
CREATE TABLE IF NOT EXISTS daily_metrics (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  date TEXT NOT NULL,
  sales_amount REAL DEFAULT 0,
  sales_count INTEGER DEFAULT 0,
  listings_added INTEGER DEFAULT 0,
  listings_total INTEGER DEFAULT 0,
  add_to_cart INTEGER DEFAULT 0,
  seo_visits INTEGER DEFAULT 0,
  updated_by TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(store_id, date)
);

-- Metric Updates Table (Audit Trail)
CREATE TABLE IF NOT EXISTS metric_updates (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  metric_type TEXT NOT NULL,
  previous_value REAL,
  added_value REAL,
  new_value REAL,
  updated_by TEXT NOT NULL REFERENCES users(id),
  updated_at TEXT DEFAULT (datetime('now')),
  note TEXT
);

-- Listings Table
CREATE TABLE IF NOT EXISTS listings (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  title TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  etsy_listing_id TEXT,
  category TEXT,
  tags TEXT,
  price REAL,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_metrics_store_date ON daily_metrics(store_id, date);
CREATE INDEX IF NOT EXISTS idx_metric_updates_store ON metric_updates(store_id);
CREATE INDEX IF NOT EXISTS idx_listings_store ON listings(store_id);
CREATE INDEX IF NOT EXISTS idx_store_members_store ON store_members(store_id);
CREATE INDEX IF NOT EXISTS idx_store_members_user ON store_members(user_id);
`

  const statements = schema
    .split(';')
    .filter(s => s.trim() && !s.trim().startsWith('--'))

  for (const stmt of statements) {
    await db.prepare(stmt).run()
  }
}

export async function clearDatabase(db: D1Database): Promise<void> {
  await db.prepare(`DELETE FROM metric_updates`).run()
  await db.prepare(`DELETE FROM daily_metrics`).run()
  await db.prepare(`DELETE FROM listings`).run()
  await db.prepare(`DELETE FROM store_members`).run()
  await db.prepare(`DELETE FROM stores`).run()
  await db.prepare(`DELETE FROM users`).run()
}

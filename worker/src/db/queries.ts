/**
 * Database Query Functions
 * All CRUD operations for Empire project database
 */

import type {
  User,
  Store,
  DailyMetrics,
  MetricUpdate,
  Listing,
  StoreMember,
  CreateUserInput,
  CreateStoreInput,
  UpdateStoreInput,
  UpdateMetricsInput,
  CreateListingInput,
  UpdateListingInput,
  InviteMemberInput,
  MetricType,
} from './schema'

// ============================================
// Utility Functions
// ============================================

function generateId(): string {
  return crypto.randomUUID()
}

// ============================================
// Users Queries
// ============================================

export async function createUser(
  db: D1Database,
  input: CreateUserInput
): Promise<User> {
  const id = generateId()
  const { email, name, password, role = 'viewer' } = input
  const created_at = new Date().toISOString()

  const result = await db
    .prepare(
      `INSERT INTO users (id, email, name, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, email, name, password, role, created_at)
    .run()

  return {
    id,
    email,
    name,
    password_hash: password,
    role,
    avatar_url: null,
    created_at,
  }
}

export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<User | null> {
  const result = await db
    .prepare(`SELECT * FROM users WHERE email = ?`)
    .bind(email)
    .first<User>()

  return result || null
}

export async function getUserById(
  db: D1Database,
  id: string
): Promise<User | null> {
  const result = await db
    .prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(id)
    .first<User>()

  return result || null
}

export async function getAllUsers(db: D1Database): Promise<User[]> {
  const result = await db
    .prepare(`SELECT * FROM users ORDER BY created_at DESC`)
    .all<User>()

  return result || []
}

export async function updateUserPassword(
  db: D1Database,
  userId: string,
  passwordHash: string
): Promise<void> {
  await db
    .prepare(`UPDATE users SET password_hash = ? WHERE id = ?`)
    .bind(passwordHash, userId)
    .run()
}

// ============================================
// Stores Queries
// ============================================

export async function createStore(
  db: D1Database,
  input: CreateStoreInput
): Promise<Store> {
  const id = generateId()
  const { name, etsy_url, logo_emoji = '🏪', created_by } = input
  const created_at = new Date().toISOString()
  const updated_at = created_at

  await db
    .prepare(
      `INSERT INTO stores (id, name, etsy_url, logo_emoji, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, name, etsy_url || null, logo_emoji, created_by, created_at, updated_at)
    .run()

  return {
    id,
    name,
    etsy_url: etsy_url || null,
    logo_emoji,
    created_by,
    created_at,
    updated_at,
  }
}

export async function getStoreById(
  db: D1Database,
  id: string
): Promise<Store | null> {
  const result = await db
    .prepare(`SELECT * FROM stores WHERE id = ?`)
    .bind(id)
    .first<Store>()

  return result || null
}

export async function getStoresByUser(
  db: D1Database,
  userId: string
): Promise<Store[]> {
  // Get all stores where user is a member
  const result = await db
    .prepare(
      `SELECT DISTINCT s.* FROM stores s
       JOIN store_members sm ON s.id = sm.store_id
       WHERE sm.user_id = ?
       ORDER BY s.created_at DESC`
    )
    .bind(userId)
    .all<Store>()

  return result || []
}

export async function getAllStores(db: D1Database): Promise<Store[]> {
  const result = await db
    .prepare(`SELECT * FROM stores ORDER BY created_at DESC`)
    .all<Store>()

  return result || []
}

export async function updateStore(
  db: D1Database,
  storeId: string,
  input: UpdateStoreInput
): Promise<Store | null> {
  const { name, etsy_url, logo_emoji } = input
  const updated_at = new Date().toISOString()

  // Build dynamic update query
  const updates: string[] = []
  const binds: (string | number | null)[] = []

  if (name !== undefined) {
    updates.push('name = ?')
    binds.push(name)
  }
  if (etsy_url !== undefined) {
    updates.push('etsy_url = ?')
    binds.push(etsy_url || null)
  }
  if (logo_emoji !== undefined) {
    updates.push('logo_emoji = ?')
    binds.push(logo_emoji)
  }

  if (updates.length === 0) {
    return getStoreById(db, storeId)
  }

  updates.push('updated_at = ?')
  binds.push(updated_at)
  binds.push(storeId)

  await db
    .prepare(`UPDATE stores SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...binds)
    .run()

  return getStoreById(db, storeId)
}

export async function deleteStore(db: D1Database, storeId: string): Promise<void> {
  // Delete all related data first
  await db.prepare(`DELETE FROM metric_updates WHERE store_id = ?`).bind(storeId).run()
  await db.prepare(`DELETE FROM daily_metrics WHERE store_id = ?`).bind(storeId).run()
  await db.prepare(`DELETE FROM listings WHERE store_id = ?`).bind(storeId).run()
  await db.prepare(`DELETE FROM store_members WHERE store_id = ?`).bind(storeId).run()
  await db.prepare(`DELETE FROM stores WHERE id = ?`).bind(storeId).run()
}

// ============================================
// Store Members Queries
// ============================================

export async function addStoreMember(
  db: D1Database,
  input: InviteMemberInput
): Promise<StoreMember> {
  const id = generateId()
  const { store_id, user_id, role, invited_by } = input
  const joined_at = new Date().toISOString()

  await db
    .prepare(
      `INSERT INTO store_members (id, store_id, user_id, role, invited_by, joined_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(id, store_id, user_id, role, invited_by || null, joined_at)
    .run()

  return {
    id,
    store_id,
    user_id,
    role,
    invited_by: invited_by || null,
    joined_at,
  }
}

export async function getStoreMembers(
  db: D1Database,
  storeId: string
): Promise<Array<StoreMember & { user_name: string; user_email: string }>> {
  const result = await db
    .prepare(
      `SELECT sm.*, u.name as user_name, u.email as user_email
       FROM store_members sm
       JOIN users u ON sm.user_id = u.id
       WHERE sm.store_id = ?
       ORDER BY sm.joined_at ASC`
    )
    .bind(storeId)
    .all<any>()

  return result || []
}

export async function removeStoreMember(
  db: D1Database,
  storeId: string,
  userId: string
): Promise<void> {
  await db
    .prepare(`DELETE FROM store_members WHERE store_id = ? AND user_id = ?`)
    .bind(storeId, userId)
    .run()
}

export async function getStoresByMember(
  db: D1Database,
  userId: string
): Promise<Array<{ store_id: string; role: string }>> {
  const result = await db
    .prepare(`SELECT store_id, role FROM store_members WHERE user_id = ?`)
    .bind(userId)
    .all<{ store_id: string; role: string }>()

  return result || []
}

// ============================================
// Daily Metrics Queries
// ============================================

export async function getMetrics(
  db: D1Database,
  storeId: string,
  date: string
): Promise<DailyMetrics | null> {
  const result = await db
    .prepare(`SELECT * FROM daily_metrics WHERE store_id = ? AND date = ?`)
    .bind(storeId, date)
    .first<DailyMetrics>()

  return result || null
}

export async function getMetricsRange(
  db: D1Database,
  storeId: string,
  startDate: string,
  endDate: string
): Promise<DailyMetrics[]> {
  const result = await db
    .prepare(
      `SELECT * FROM daily_metrics
       WHERE store_id = ? AND date BETWEEN ? AND ?
       ORDER BY date ASC`
    )
    .bind(storeId, startDate, endDate)
    .all<DailyMetrics>()

  return result || []
}

export async function createOrUpdateMetrics(
  db: D1Database,
  input: UpdateMetricsInput & { store_id: string }
): Promise<DailyMetrics> {
  const { store_id, date, updated_by, ...metrics } = input
  const updated_at = new Date().toISOString()

  // Check if metrics already exist for this date
  const existing = await getMetrics(db, store_id, date)

  if (existing) {
    // Update existing
    const updates: string[] = ['updated_by = ?', 'updated_at = ?']
    const binds: (string | number)[] = [updated_by, updated_at]

    Object.entries(metrics).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`)
        binds.push(value)
      }
    })

    binds.push(store_id, date)

    await db
      .prepare(`UPDATE daily_metrics SET ${updates.join(', ')} WHERE store_id = ? AND date = ?`)
      .bind(...binds)
      .run()
  } else {
    // Create new
    const id = generateId()
    const defaults = {
      sales_amount: 0,
      sales_count: 0,
      listings_added: 0,
      listings_total: 0,
      add_to_cart: 0,
      seo_visits: 0,
    }

    await db
      .prepare(
        `INSERT INTO daily_metrics
         (id, store_id, date, sales_amount, sales_count, listings_added,
          listings_total, add_to_cart, seo_visits, updated_by, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        store_id,
        date,
        metrics.sales_amount ?? defaults.sales_amount,
        metrics.sales_count ?? defaults.sales_count,
        metrics.listings_added ?? defaults.listings_added,
        metrics.listings_total ?? defaults.listings_total,
        metrics.add_to_cart ?? defaults.add_to_cart,
        metrics.seo_visits ?? defaults.seo_visits,
        updated_by,
        updated_at
      )
      .run()
  }

  return (await getMetrics(db, store_id, date))!
}

export async function addMetricValue(
  db: D1Database,
  storeId: string,
  metricType: MetricType,
  addedValue: number,
  updatedBy: string
): Promise<{ metrics: DailyMetrics; update: MetricUpdate }> {
  const today = new Date().toISOString().split('T')[0]

  // Get current metrics
  let current = await getMetrics(db, storeId, today)
  const previousValue = current?.[metricType] || 0
  const newValue = previousValue + addedValue

  // Update metrics
  const updated = await createOrUpdateMetrics(db, {
    store_id: storeId,
    date: today,
    [metricType]: newValue,
    updated_by: updatedBy,
  })

  // Create metric update record
  const update = await createMetricUpdate(db, {
    store_id: storeId,
    metric_type: metricType,
    previous_value: previousValue,
    added_value: addedValue,
    new_value: newValue,
    updated_by: updatedBy,
  })

  return { metrics: updated, update }
}

// ============================================
// Metric Updates (Audit Trail) Queries
// ============================================

export async function createMetricUpdate(
  db: D1Database,
  input: {
    store_id: string
    metric_type: MetricType
    previous_value: number | null
    added_value: number
    new_value: number
    updated_by: string
    note?: string
  }
): Promise<MetricUpdate> {
  const id = generateId()
  const { store_id, metric_type, previous_value, added_value, new_value, updated_by, note } =
    input
  const updated_at = new Date().toISOString()

  await db
    .prepare(
      `INSERT INTO metric_updates
         (id, store_id, metric_type, previous_value, added_value, new_value,
          updated_by, updated_at, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      store_id,
      metric_type,
      previous_value,
      added_value,
      new_value,
      updated_by,
      updated_at,
      note || null
    )
    .run()

  return {
    id,
    store_id,
    metric_type,
    previous_value,
    added_value,
    new_value,
    updated_by,
    updated_at,
    note: note || null,
  }
}

export async function getMetricHistory(
  db: D1Database,
  storeId: string,
  metricType?: MetricType,
  limit = 50
): Promise<MetricUpdate[]> {
  const query = metricType
    ? `SELECT * FROM metric_updates WHERE store_id = ? AND metric_type = ? ORDER BY updated_at DESC LIMIT ?`
    : `SELECT * FROM metric_updates WHERE store_id = ? ORDER BY updated_at DESC LIMIT ?`

  const result = metricType
    ? await db.prepare(query).bind(storeId, metricType, limit).all<MetricUpdate>()
    : await db.prepare(query).bind(storeId, limit).all<MetricUpdate>()

  return result || []
}

export async function getRecentMetricUpdates(
  db: D1Database,
  limit = 100
): Promise<Array<MetricUpdate & { store_name: string; user_name: string }>> {
  const result = await db
    .prepare(
      `SELECT mu.*, s.name as store_name, u.name as user_name
       FROM metric_updates mu
       JOIN stores s ON mu.store_id = s.id
       JOIN users u ON mu.updated_by = u.id
       ORDER BY mu.updated_at DESC
       LIMIT ?`
    )
    .bind(limit)
    .all<any>()

  return result || []
}

// ============================================
// Listings Queries
// ============================================

export async function createListing(
  db: D1Database,
  input: CreateListingInput
): Promise<Listing> {
  const id = generateId()
  const {
    store_id,
    title,
    status = 'draft',
    etsy_listing_id,
    category,
    tags,
    price,
    created_by,
  } = input
  const created_at = new Date().toISOString()

  await db
    .prepare(
      `INSERT INTO listings
         (id, store_id, title, status, etsy_listing_id, category, tags, price, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      store_id,
      title,
      status,
      etsy_listing_id || null,
      category || null,
      tags || null,
      price || null,
      created_by,
      created_at
    )
    .run()

  return {
    id,
    store_id,
    title,
    status,
    etsy_listing_id: etsy_listing_id || null,
    category: category || null,
    tags: tags || null,
    price: price || null,
    created_by,
    created_at,
  }
}

export async function getListingById(
  db: D1Database,
  id: string
): Promise<Listing | null> {
  const result = await db
    .prepare(`SELECT * FROM listings WHERE id = ?`)
    .bind(id)
    .first<Listing>()

  return result || null
}

export async function getListingsByStore(
  db: D1Database,
  storeId: string,
  status?: string
): Promise<Listing[]> {
  const query = status
    ? `SELECT * FROM listings WHERE store_id = ? AND status = ? ORDER BY created_at DESC`
    : `SELECT * FROM listings WHERE store_id = ? ORDER BY created_at DESC`

  const result = status
    ? await db.prepare(query).bind(storeId, status).all<Listing>()
    : await db.prepare(query).bind(storeId).all<Listing>()

  return result || []
}

export async function updateListing(
  db: D1Database,
  listingId: string,
  input: UpdateListingInput
): Promise<Listing | null> {
  const { title, status, etsy_listing_id, category, tags, price } = input

  // Build dynamic update query
  const updates: string[] = []
  const binds: (string | number | null)[] = []

  if (title !== undefined) {
    updates.push('title = ?')
    binds.push(title)
  }
  if (status !== undefined) {
    updates.push('status = ?')
    binds.push(status)
  }
  if (etsy_listing_id !== undefined) {
    updates.push('etsy_listing_id = ?')
    binds.push(etsy_listing_id || null)
  }
  if (category !== undefined) {
    updates.push('category = ?')
    binds.push(category || null)
  }
  if (tags !== undefined) {
    updates.push('tags = ?')
    binds.push(tags || null)
  }
  if (price !== undefined) {
    updates.push('price = ?')
    binds.push(price || null)
  }

  if (updates.length === 0) {
    return getListingById(db, listingId)
  }

  binds.push(listingId)

  await db
    .prepare(`UPDATE listings SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...binds)
    .run()

  return getListingById(db, listingId)
}

export async function deleteListing(db: D1Database, listingId: string): Promise<void> {
  await db.prepare(`DELETE FROM listings WHERE id = ?`).bind(listingId).run()
}

// ============================================
// Dashboard & Analytics Queries
// ============================================

export async function getDashboardData(
  db: D1Database,
  storeId: string,
  days = 7
): Promise<{
  store: Store | null
  today: DailyMetrics | null
  trend: Array<{ date: string; value: number }>
}> {
  const store = await getStoreById(db, storeId)

  // Get today's metrics
  const today = new Date().toISOString().split('T')[0]
  const todayMetrics = await getMetrics(db, storeId, today)

  // Get trend data for sales
  const trend: Array<{ date: string; value: number }> = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayMetrics = await getMetrics(db, storeId, dateStr)
    trend.push({
      date: dateStr,
      value: dayMetrics?.sales_amount || 0,
    })
  }

  return {
    store,
    today: todayMetrics,
    trend,
  }
}

export async function getStoreComparison(
  db: D1Database,
  storeIds: string[],
  startDate: string,
  endDate: string,
  metricType: MetricType = 'sales_amount'
): Promise<
  Array<{
    store: Store
    total: number
    daily: Array<{ date: string; value: number }>
  }>
> {
  const comparison = await Promise.all(
    storeIds.map(async (storeId) => {
      const store = await getStoreById(db, storeId)
      const metrics = await getMetricsRange(db, storeId, startDate, endDate)
      const total = metrics.reduce((sum, m) => sum + (m[metricType] || 0), 0)
      return {
        store: store!,
        total,
        daily: metrics.map((m) => ({ date: m.date, value: m[metricType] || 0 })),
      }
    })
  )

  return comparison
}

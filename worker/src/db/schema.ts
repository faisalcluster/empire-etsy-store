/**
 * Database Schema Type Definitions
 * Based on schema.sql for Empire project
 */

// ============================================
// Users Table
// ============================================
export interface User {
  id: string
  email: string
  name: string
  password_hash: string
  role: 'admin' | 'manager' | 'viewer'
  avatar_url: string | null
  created_at: string
}

// ============================================
// Stores Table
// ============================================
export interface Store {
  id: string
  name: string
  etsy_url: string | null
  logo_emoji: string
  created_by: string
  created_at: string
  updated_at: string
}

// ============================================
// Store Members Table
// ============================================
export interface StoreMember {
  id: string
  store_id: string
  user_id: string
  role: 'admin' | 'manager' | 'viewer'
  invited_by: string | null
  joined_at: string
}

// ============================================
// Daily Metrics Table
// ============================================
export interface DailyMetrics {
  id: string
  store_id: string
  date: string // YYYY-MM-DD format
  sales_amount: number
  sales_count: number
  listings_added: number
  listings_total: number
  add_to_cart: number
  seo_visits: number
  updated_by: string | null
  updated_at: string
}

export type MetricType =
  | 'sales_amount'
  | 'sales_count'
  | 'listings_added'
  | 'listings_total'
  | 'add_to_cart'
  | 'seo_visits'

// ============================================
// Metric Updates Table (Audit Trail)
// ============================================
export interface MetricUpdate {
  id: string
  store_id: string
  metric_type: MetricType
  previous_value: number | null
  added_value: number
  new_value: number
  updated_by: string
  updated_at: string
  note: string | null
}

// ============================================
// Listings Table
// ============================================
export interface Listing {
  id: string
  store_id: string
  title: string
  status: 'draft' | 'active' | 'inactive' | 'sold'
  etsy_listing_id: string | null
  category: string | null
  tags: string | null // Comma-separated
  price: number | null
  created_by: string
  created_at: string
}

// ============================================
// Activity (Virtual - not a table)
// ============================================
export interface Activity {
  id: string
  user: string
  action: string
  time: string
  color: string
}

// ============================================
// Response Types
// ============================================
export interface StoreWithMemberCount extends Store {
  member_count: number
}

export interface UserWithStores extends User {
  stores: Array<{ store_id: string; role: string }>
}

export interface DashboardMetrics {
  store: Store
  today: DailyMetrics
  trend: Array<{ date: string; value: number }>
  recentUpdates: MetricUpdate[]
}

// ============================================
// Input Types for Creation/Updates
// ============================================
export interface CreateUserInput {
  email: string
  name: string
  password: string
  role?: 'admin' | 'manager' | 'viewer'
}

export interface CreateStoreInput {
  name: string
  etsy_url?: string
  logo_emoji?: string
  created_by: string
}

export interface UpdateStoreInput {
  name?: string
  etsy_url?: string
  logo_emoji?: string
}

export interface UpdateMetricsInput {
  date: string
  sales_amount?: number
  sales_count?: number
  listings_added?: number
  listings_total?: number
  add_to_cart?: number
  seo_visits?: number
  updated_by: string
}

export interface CreateListingInput {
  store_id: string
  title: string
  status?: 'draft' | 'active' | 'inactive' | 'sold'
  etsy_listing_id?: string
  category?: string
  tags?: string
  price?: number
  created_by: string
}

export interface UpdateListingInput {
  title?: string
  status?: 'draft' | 'active' | 'inactive' | 'sold'
  etsy_listing_id?: string
  category?: string
  tags?: string
  price?: number
}

export interface InviteMemberInput {
  store_id: string
  email: string
  name: string
  role: 'manager' | 'viewer'
  invited_by: string
}

// ============================================
// LocalStorage Data Structure (for migration)
// ============================================
export interface LocalStorageData {
  user: User | null
  users: User[]
  stores: Store[]
  selectedStoreId: string
  metrics: Record<string, Record<string, DailyMetrics>>
  metricHistory: MetricUpdate[]
  teamMembers: Array<{ id: string; email: string; name: string; role: string }>
  activity: Activity[]
}

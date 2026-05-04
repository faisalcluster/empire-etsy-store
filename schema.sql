-- Empire Database Schema (Cloudflare D1 - SQLite)

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  etsy_url TEXT,
  logo_emoji TEXT DEFAULT '🏪',
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'viewer',
  avatar_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS store_members (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT DEFAULT 'viewer',
  invited_by TEXT,
  joined_at TEXT DEFAULT (datetime('now')),
  UNIQUE(store_id, user_id)
);

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

/**
 * Activity Routes
 * Recent activity feed
 */

import type { Env } from '../worker'
import { corsHeaders } from '../auth/middleware'
import { getRecentMetricUpdates } from '../db/queries'

/**
 * GET /api/activity
 * Get recent activity across all stores
 */
export async function getActivityHandler(request: Request, env: Env): Promise<Response> {
  try {
    const cors = corsHeaders()

    // Parse query params
    const url = new URL(request.url)
    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 100

    // Get recent metric updates as activity
    const updates = await getRecentMetricUpdates(env.DB, limit)

    // Transform to activity format
    const activity = updates.map((u) => ({
      id: u.id,
      user: u.user_name,
      action: `added $${u.added_value} to ${u.metric_type.replace(/_/g, ' ')}`,
      time: u.updated_at,
      color:
        u.metric_type === 'sales_amount'
          ? '#667eea'
          : u.metric_type === 'listings_added'
            ? '#00c6fb'
            : u.metric_type === 'add_to_cart'
              ? '#f093fb'
              : '#43e97b',
      store_id: u.store_id,
      store_name: u.store_name,
    }))

    return Response.json({ activity }, { headers: cors })
  } catch (error) {
    console.error('Get activity error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/activity/store/:storeId
 * Get activity for specific store
 */
export async function getStoreActivityHandler(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const storeId = url.pathname.split('/').slice(-2, -1)[0] || ''
    const cors = corsHeaders()

    if (!storeId) {
      return Response.json({ error: 'Store ID required' }, { status: 400, headers: cors })
    }

    const limitParam = url.searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 50

    // Get metric updates for this store
    const result = await env.DB
      .prepare(
        `SELECT mu.*, s.name as store_name, u.name as user_name
         FROM metric_updates mu
         JOIN stores s ON mu.store_id = s.id
         JOIN users u ON mu.updated_by = u.id
         WHERE mu.store_id = ?
         ORDER BY mu.updated_at DESC
         LIMIT ?`
      )
      .bind(storeId, limit)
      .all<any>()

    const updates = result || []

    // Transform to activity format
    const activity = updates.map((u) => ({
      id: u.id,
      user: u.user_name,
      action: `added $${u.added_value} to ${u.metric_type.replace(/_/g, ' ')}`,
      time: u.updated_at,
      color:
        u.metric_type === 'sales_amount'
          ? '#667eea'
          : u.metric_type === 'listings_added'
            ? '#00c6fb'
            : u.metric_type === 'add_to_cart'
              ? '#f093fb'
              : '#43e97b',
      store_id: u.store_id,
      store_name: u.store_name,
    }))

    return Response.json({ activity }, { headers: cors })
  } catch (error) {
    console.error('Get store activity error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Metrics Routes
 * Store metrics operations
 */

import type { Env } from '../worker'
import { checkStoreMembership, cors } from '../auth/middleware'
import {
  getMetrics,
  getMetricsRange,
  createOrUpdateMetrics,
  addMetricValue,
  getMetricHistory,
  getRecentMetricUpdates,
  getDashboardData,
} from '../db/queries'
import type { MetricType } from '../db/schema'

/**
 * GET /api/metrics/store/:storeId
 * Get metrics for a store
 */
export async function getMetricsHandler(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const storeId = url.pathname.split('/').slice(-2, -1)[0] || url.pathname.split('/').pop() || ''
    const cors = cors()

    if (!storeId) {
      return Response.json({ error: 'Store ID required' }, { status: 400, headers: cors })
    }

    const dateParam = url.searchParams.get('date')
    const date = dateParam || new Date().toISOString().split('T')[0]

    // Auth check
    const authResult = await checkStoreMembership(request, env, storeId)
    if (authResult instanceof Response) {
      return authResult
    }

    const metrics = await getMetrics(env.DB, storeId, date)

    return Response.json({ metrics }, { headers: cors })
  } catch (error) {
    console.error('Get metrics error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/metrics/store/:storeId
 * Add or update metrics
 */
export async function addMetricsHandler(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const storeId = url.pathname.split('/').slice(-2, -1)[0] || ''
    const cors = cors()

    if (!storeId) {
      return Response.json({ error: 'Store ID required' }, { status: 400, headers: cors })
    }

    // Auth check
    const authResult = await checkStoreMembership(request, env, storeId)
    if (authResult instanceof Response) {
      return authResult
    }

    const { user } = authResult
    const body = await request.json()

    if (body.addValue !== undefined) {
      // Add specific metric value
      const metricType = body.metricType as MetricType
      if (!metricType) {
        return Response.json(
          { error: 'metricType required when adding value' },
          { status: 400, headers: cors }
        )
      }

      const result = await addMetricValue(env.DB, storeId, metricType, body.addValue, user.id)

      return Response.json(result, { headers: cors })
    } else {
      // Create or update metrics for a date
      if (!body.date) {
        return Response.json({ error: 'Date required' }, { status: 400, headers: cors })
      }

      const metrics = await createOrUpdateMetrics(env.DB, {
        store_id: storeId,
        date: body.date,
        ...body,
        updated_by: user.id,
      })

      return Response.json({ metrics }, { status: 201, headers: cors })
    }
  } catch (error) {
    console.error('Add metrics error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/metrics/store/:storeId/history
 * Get metric history
 */
export async function getMetricsHistoryHandler(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const storeId = url.pathname.split('/').slice(-2, -1)[0] || ''
    const cors = cors()

    if (!storeId) {
      return Response.json({ error: 'Store ID required' }, { status: 400, headers: cors })
    }

    // Auth check
    const authResult = await checkStoreMembership(request, env, storeId)
    if (authResult instanceof Response) {
      return authResult
    }

    const metricTypeParam = url.searchParams.get('metricType')
    const limitParam = url.searchParams.get('limit')
    const metricType = metricTypeParam as MetricType | undefined
    const limit = limitParam ? parseInt(limitParam, 10) : 50

    const history = await getMetricHistory(env.DB, storeId, metricType, limit)

    return Response.json({ history }, { headers: cors })
  } catch (error) {
    console.error('Get metrics history error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/metrics/store/:storeId/trend
 * Get trend data for chart
 */
export async function getMetricsTrendHandler(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const storeId = url.pathname.split('/').slice(-2, -1)[0] || ''
    const cors = cors()

    if (!storeId) {
      return Response.json({ error: 'Store ID required' }, { status: 400, headers: cors })
    }

    // Auth check
    const authResult = await checkStoreMembership(request, env, storeId)
    if (authResult instanceof Response) {
      return authResult
    }

    const daysParam = url.searchParams.get('days')
    const days = daysParam ? parseInt(daysParam, 10) : 7
    const metricType = (url.searchParams.get('metricType') as MetricType) || 'sales_amount'

    // Get date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    const metrics = await getMetricsRange(env.DB, storeId, startDateStr, endDateStr)

    const trend = metrics.map((m) => ({
      date: m.date,
      value: m[metricType] || 0,
    }))

    return Response.json({ trend }, { headers: cors })
  } catch (error) {
    console.error('Get trend error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/metrics/dashboard/:storeId
 * Get dashboard data for a store
 */
export async function getDashboardDataHandler(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const storeId = url.pathname.split('/').pop() || ''
    const cors = cors()

    if (!storeId) {
      return Response.json({ error: 'Store ID required' }, { status: 400, headers: cors })
    }

    // Auth check
    const authResult = await checkStoreMembership(request, env, storeId)
    if (authResult instanceof Response) {
      return authResult
    }

    const daysParam = url.searchParams.get('days')
    const days = daysParam ? parseInt(daysParam, 10) : 7

    const dashboard = await getDashboardData(env.DB, storeId, days)

    return Response.json(dashboard, { headers: cors })
  } catch (error) {
    console.error('Get dashboard data error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Empire API - Cloudflare Worker
 * REST API for Etsy store analytics dashboard
 */

import { Router } from 'itty-router'

// Import route handlers
import * as authRoutes from './routes/auth'
import * as storeRoutes from './routes/stores'
import * as metricsRoutes from './routes/metrics'
import * as listingRoutes from './routes/listings'
import * as teamRoutes from './routes/team'
import * as activityRoutes from './routes/activity'

// Create router
const router = Router()

// ============================================
// Auth Routes
// ============================================
router.post('/api/auth/login', authRoutes.loginHandler)
router.post('/api/auth/register', authRoutes.registerHandler)
router.post('/api/auth/refresh', authRoutes.refreshHandler)
router.get('/api/auth/verify', authRoutes.verifyHandler)
router.post('/api/auth/logout', authRoutes.logoutHandler)

// ============================================
// Store Routes
// ============================================
router.get('/api/stores', storeRoutes.getStoresHandler)
router.post('/api/stores', storeRoutes.createStoreHandler)
router.get('/api/stores/:id', storeRoutes.getStoreHandler)
router.put('/api/stores/:id', storeRoutes.updateStoreHandler)
router.delete('/api/stores/:id', storeRoutes.deleteStoreHandler)

// ============================================
// Metrics Routes
// ============================================
router.get('/api/metrics/store/:storeId', metricsRoutes.getMetricsHandler)
router.post('/api/metrics/store/:storeId', metricsRoutes.addMetricsHandler)
router.get('/api/metrics/store/:storeId/history', metricsRoutes.getMetricsHistoryHandler)
router.get('/api/metrics/store/:storeId/trend', metricsRoutes.getMetricsTrendHandler)
router.get('/api/metrics/dashboard/:storeId', metricsRoutes.getDashboardDataHandler)

// ============================================
// Listings Routes
// ============================================
router.get('/api/listings/store/:storeId', listingRoutes.getListingsHandler)
router.post('/api/listings/store/:storeId', listingRoutes.createListingHandler)
router.get('/api/listings/:id', listingRoutes.getListingHandler)
router.put('/api/listings/:id', listingRoutes.updateListingHandler)
router.delete('/api/listings/:id', listingRoutes.deleteListingHandler)

// ============================================
// Team Routes
// ============================================
router.get('/api/team/store/:storeId', teamRoutes.getTeamHandler)
router.post('/api/team/invite', teamRoutes.inviteMemberHandler)
router.delete('/api/team/:memberId', teamRoutes.removeMemberHandler)
router.put('/api/team/:memberId/role', teamRoutes.updateMemberRoleHandler)

// ============================================
// Activity Routes
// ============================================
router.get('/api/activity', activityRoutes.getActivityHandler)
router.get('/api/activity/store/:storeId', activityRoutes.getStoreActivityHandler)

// ============================================
// CORS Preflight
// ============================================
router.options('*', () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
})

// ============================================
// Health Check & Info
// ============================================
router.get('/health', () => {
  return Response.json({ status: 'healthy', service: 'Empire API', version: '1.0.0' })
})

router.get('/', () => {
  return Response.json({
    service: 'Empire API',
    description: 'Etsy store analytics dashboard backend',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      stores: '/api/stores',
      metrics: '/api/metrics/*',
      listings: '/api/listings/*',
      team: '/api/team/*',
      activity: '/api/activity/*',
    },
  })
})

// ============================================
// 404 Handler
// ============================================
router.all('*', () => {
  return Response.json({ error: 'Not Found' }, { status: 404 })
})

// ============================================
// Error Handler
// ============================================
router.onerror = (error: Error) => {
  console.error('Worker error:', error)
  return Response.json(
    { error: 'Internal Server Error', message: error.message },
    { status: 500 }
  )
}

// ============================================
// Export
// ============================================
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const response = await router.handle(request, env)

    // Add CORS headers to all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    const newResponse = new Response(response.body, response)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newResponse.headers.set(key, value)
    })

    return newResponse
  },
} satisfies ExportedHandler<Env>

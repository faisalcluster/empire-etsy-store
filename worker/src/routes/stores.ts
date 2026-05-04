/**
 * Stores Routes
 * CRUD operations for stores
 */

import type { Env } from '../worker'
import { authMiddleware } from '../auth/middleware'
import {
  createStore,
  getStoreById,
  getStoresByUser,
  getAllStores,
  updateStore,
  deleteStore,
} from '../db/queries'
import type { CreateStoreInput, UpdateStoreInput } from '../db/schema'

/**
 * GET /api/stores
 * Get all stores for authenticated user
 */
export async function getStoresHandler(request: Request, env: Env): Promise<Response> {
  try {
    const authResult = await authMiddleware(request, env)

    if (authResult instanceof Response) {
      return authResult
    }

    const { user } = authResult
    const stores = await getStoresByUser(env.DB, user.id)

    return Response.json({ stores }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Get stores error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/stores
 * Create new store
 */
export async function createStoreHandler(request: Request, env: Env): Promise<Response> {
  try {
    const authResult = await authMiddleware(request, env)

    if (authResult instanceof Response) {
      return authResult
    }

    const { user } = authResult
    const input: CreateStoreInput = await request.json()

    if (!input.name) {
      return Response.json({ error: 'Store name required' }, { status: 400 })
    }

    input.created_by = user.id

    const store = await createStore(env.DB, input)

    // Add creator as admin member
    const memberId = crypto.randomUUID()
    await env.DB
      .prepare(
        `INSERT INTO store_members (id, store_id, user_id, role, joined_at)
         VALUES (?, ?, ?, 'admin', ?)`
      )
      .bind(memberId, store.id, user.id, new Date().toISOString())
      .run()

    return Response.json({ store }, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Create store error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/stores/:id
 * Get specific store
 */
export async function getStoreHandler(request: Request, env: Env): Promise<Response> {
  try {
    const authResult = await authMiddleware(request, env)

    if (authResult instanceof Response) {
      return authResult
    }

    const { user } = authResult
    const url = new URL(request.url)
    const storeId = url.pathname.split('/').pop()

    if (!storeId) {
      return Response.json({ error: 'Store ID required' }, { status: 400 })
    }

    // Check if user is member
    const membership = await env.DB
      .prepare(`SELECT role FROM store_members WHERE store_id = ? AND user_id = ?`)
      .bind(storeId, user.id)
      .first<{ role: string }>()

    if (!membership) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    const store = await getStoreById(env.DB, storeId)

    if (!store) {
      return Response.json({ error: 'Store not found' }, { status: 404 })
    }

    return Response.json({ store }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Get store error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/stores/:id
 * Update store
 */
export async function updateStoreHandler(request: Request, env: Env): Promise<Response> {
  try {
    const authResult = await authMiddleware(request, env)

    if (authResult instanceof Response) {
      return authResult
    }

    const { user } = authResult
    const url = new URL(request.url)
    const storeId = url.pathname.split('/').pop()

    if (!storeId) {
      return Response.json({ error: 'Store ID required' }, { status: 400 })
    }

    // Check if user is admin or manager of store
    const membership = await env.DB
      .prepare(`SELECT role FROM store_members WHERE store_id = ? AND user_id = ?`)
      .bind(storeId, user.id)
      .first<{ role: string }>()

    if (!membership || (membership.role !== 'admin' && membership.role !== 'manager')) {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    const input: UpdateStoreInput = await request.json()

    const store = await updateStore(env.DB, storeId, input)

    if (!store) {
      return Response.json({ error: 'Store not found' }, { status: 404 })
    }

    return Response.json({ store }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Update store error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/stores/:id
 * Delete store (admin only)
 */
export async function deleteStoreHandler(request: Request, env: Env): Promise<Response> {
  try {
    const authResult = await authMiddleware(request, env)

    if (authResult instanceof Response) {
      return authResult
    }

    const { user } = authResult
    const url = new URL(request.url)
    const storeId = url.pathname.split('/').pop()

    if (!storeId) {
      return Response.json({ error: 'Store ID required' }, { status: 400 })
    }

    // Check if user is admin of store
    const membership = await env.DB
      .prepare(`SELECT role FROM store_members WHERE store_id = ? AND user_id = ?`)
      .bind(storeId, user.id)
      .first<{ role: string }>()

    if (!membership || membership.role !== 'admin') {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    await deleteStore(env.DB, storeId)

    return Response.json({ message: 'Store deleted' }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Delete store error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Listings Routes
 * Etsy listings CRUD operations
 */

import type { Env } from '../worker'
import { checkStoreMembership, cors } from '../auth/middleware'
import {
  createListing,
  getListingById,
  getListingsByStore,
  updateListing,
  deleteListing,
} from '../db/queries'
import type { CreateListingInput, UpdateListingInput } from '../db/schema'

/**
 * GET /api/listings/store/:storeId
 * Get all listings for a store
 */
export async function getListingsHandler(request: Request, env: Env): Promise<Response> {
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

    const statusParam = url.searchParams.get('status')
    const listings = await getListingsByStore(env.DB, storeId, statusParam || undefined)

    return Response.json({ listings }, { headers: cors })
  } catch (error) {
    console.error('Get listings error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/listings/store/:storeId
 * Create new listing
 */
export async function createListingHandler(request: Request, env: Env): Promise<Response> {
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

    const { user, role } = authResult

    // Only admins and managers can create listings
    if (role !== 'admin' && role !== 'manager') {
      return Response.json({ error: 'Access denied' }, { status: 403, headers: cors })
    }

    const input: CreateListingInput = await request.json()
    input.store_id = storeId
    input.created_by = user.id

    if (!input.title) {
      return Response.json({ error: 'Title required' }, { status: 400, headers: cors })
    }

    const listing = await createListing(env.DB, input)

    return Response.json({ listing }, { status: 201, headers: cors })
  } catch (error) {
    console.error('Create listing error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/listings/:id
 * Get specific listing
 */
export async function getListingHandler(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const listingId = url.pathname.split('/').pop() || ''
    const cors = cors()

    if (!listingId) {
      return Response.json({ error: 'Listing ID required' }, { status: 400, headers: cors })
    }

    const listing = await getListingById(env.DB, listingId)

    if (!listing) {
      return Response.json({ error: 'Listing not found' }, { status: 404, headers: cors })
    }

    // Auth check for store access
    const authResult = await checkStoreMembership(request, env, listing.store_id)
    if (authResult instanceof Response) {
      return authResult
    }

    return Response.json({ listing }, { headers: cors })
  } catch (error) {
    console.error('Get listing error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/listings/:id
 * Update listing
 */
export async function updateListingHandler(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const listingId = url.pathname.split('/').pop() || ''
    const cors = cors()

    if (!listingId) {
      return Response.json({ error: 'Listing ID required' }, { status: 400, headers: cors })
    }

    const listing = await getListingById(env.DB, listingId)

    if (!listing) {
      return Response.json({ error: 'Listing not found' }, { status: 404, headers: cors })
    }

    // Auth check for store access
    const authResult = await checkStoreMembership(request, env, listing.store_id)
    if (authResult instanceof Response) {
      return authResult
    }

    const { role } = authResult

    // Only admins and managers can update listings
    if (role !== 'admin' && role !== 'manager') {
      return Response.json({ error: 'Access denied' }, { status: 403, headers: cors })
    }

    const input: UpdateListingInput = await request.json()

    const updatedListing = await updateListing(env.DB, listingId, input)

    return Response.json({ listing: updatedListing }, { headers: cors })
  } catch (error) {
    console.error('Update listing error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/listings/:id
 * Delete listing
 */
export async function deleteListingHandler(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const listingId = url.pathname.split('/').pop() || ''
    const cors = cors()

    if (!listingId) {
      return Response.json({ error: 'Listing ID required' }, { status: 400, headers: cors })
    }

    const listing = await getListingById(env.DB, listingId)

    if (!listing) {
      return Response.json({ error: 'Listing not found' }, { status: 404, headers: cors })
    }

    // Auth check for store access
    const authResult = await checkStoreMembership(request, env, listing.store_id)
    if (authResult instanceof Response) {
      return authResult
    }

    const { role } = authResult

    // Only admins and managers can delete listings
    if (role !== 'admin' && role !== 'manager') {
      return Response.json({ error: 'Access denied' }, { status: 403, headers: cors })
    }

    await deleteListing(env.DB, listingId)

    return Response.json({ message: 'Listing deleted' }, { headers: cors })
  } catch (error) {
    console.error('Delete listing error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

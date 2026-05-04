/**
 * Authentication Middleware
 * Validates JWT tokens and checks user permissions
 */

import type { JwtPayload } from './types'
import { extractToken, verifyToken, isTokenExpired } from './jwt'
import type { User } from '../db/schema'
import { getUserById } from '../db/queries'

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 */
export async function authMiddleware(
  request: Request,
  env: Env
): Promise<Response | { user: User }> {
  const authHeader = request.headers.get('Authorization')
  const token = extractToken(authHeader)

  if (!token) {
    return Response.json({ error: 'No token provided' }, { status: 401 })
  }

  const jwtSecret = env.JWT_SECRET || 'empire-secret-key'
  const payload = await verifyToken(token, jwtSecret)

  if (!payload) {
    return Response.json({ error: 'Invalid token' }, { status: 401 })
  }

  if (isTokenExpired(payload)) {
    return Response.json({ error: 'Token expired' }, { status: 401 })
  }

  const user = await getUserById(env.DB, payload.userId)

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 })
  }

  // Remove password hash before returning
  const { password_hash, ...userWithoutPassword } = user

  return { user: userWithoutPassword as User }
}

/**
 * Role-based authorization middleware
 * Checks if user has required role or higher
 */
export function checkRole(
  user: User,
  requiredRole: 'admin' | 'manager' | 'viewer'
): boolean {
  const roleHierarchy = {
    admin: 3,
    manager: 2,
    viewer: 1,
  }

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}

/**
 * Store membership check middleware
 * Verifies user is a member of specified store
 */
export async function checkStoreMembership(
  request: Request,
  env: Env,
  storeId: string
): Promise<Response | { user: User; role: 'admin' | 'manager' | 'viewer' }> {
  const authResult = await authMiddleware(request, env)

  if (authResult instanceof Response) {
    return authResult
  }

  const { user } = authResult

  // Get user's role in this store
  const members = await env.DB.prepare(
    `SELECT role FROM store_members WHERE store_id = ? AND user_id = ?`
  )
    .bind(storeId, user.id)
    .first<{ role: string }>()

  if (!members) {
    return Response.json({ error: 'Not a member of this store' }, { status: 403 })
  }

  return {
    user,
    role: members.role as 'admin' | 'manager' | 'viewer',
  }
}

/**
 * CORS headers helper
 */
export function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  }
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  status = 500
): Response {
  return Response.json({ error: message }, {
    status,
    headers: corsHeaders(),
  })
}

/**
 * Success response helper
 */
export function successResponse(
  data: any,
  status = 200
): Response {
  return Response.json(data, {
    status,
    headers: corsHeaders(),
  })
}

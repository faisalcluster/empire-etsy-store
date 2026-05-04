/**
 * Authentication Routes
 * Login, register, logout, token verification
 */

import type { Env } from '../worker'
import { getUserByEmail, createUser, getUserById } from '../db/queries'
import { hashPassword, verifyPassword, validatePassword } from '../auth/password'
import { generateToken, verifyToken as verifyJwtToken } from '../auth/jwt'
import type { AuthRequest, RegisterRequest, AuthResponse } from '../auth/types'

/**
 * POST /api/auth/login
 * Authenticate user and return tokens
 */
export async function loginHandler(request: Request, env: Env): Promise<Response> {
  try {
    const { email, password }: AuthRequest = await request.json()

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await getUserByEmail(env.DB, email)

    if (!user) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValid = await verifyPassword(password, user.password_hash)

    if (!isValid) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const { password_hash, ...userWithoutPassword } = user

    const jwtSecret = env.JWT_SECRET || 'empire-secret-key'
    const tokens = generateToken(
      userWithoutPassword.id,
      userWithoutPassword.email,
      userWithoutPassword.name,
      userWithoutPassword.role,
      jwtSecret
    )

    const response: AuthResponse = {
      user: userWithoutPassword,
      tokens,
    }

    return Response.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/auth/register
 * Register new user
 */
export async function registerHandler(request: Request, env: Env): Promise<Response> {
  try {
    const { email, name, password, role = 'viewer' }: RegisterRequest =
      await request.json()

    if (!email || !name || !password) {
      return Response.json({ error: 'Email, name, and password required' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(env.DB, email)
    if (existingUser) {
      return Response.json({ error: 'User already exists' }, { status: 409 })
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return Response.json(
        { error: 'Invalid password', details: passwordValidation.errors },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await createUser(env.DB, {
      email,
      name,
      password: passwordHash,
      role,
    })

    const { password_hash, ...userWithoutPassword } = user

    const jwtSecret = env.JWT_SECRET || 'empire-secret-key'
    const tokens = generateToken(
      userWithoutPassword.id,
      userWithoutPassword.email,
      userWithoutPassword.name,
      userWithoutPassword.role,
      jwtSecret
    )

    const response: AuthResponse = {
      user: userWithoutPassword,
      tokens,
    }

    return Response.json(response, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
export async function refreshHandler(request: Request, env: Env): Promise<Response> {
  try {
    const { refreshToken } = await request.json()

    if (!refreshToken) {
      return Response.json({ error: 'Refresh token required' }, { status: 400 })
    }

    const jwtSecret = env.JWT_SECRET || 'empire-secret-key'
    const payload = verifyJwtToken(refreshToken, jwtSecret)

    if (!payload) {
      return Response.json({ error: 'Invalid refresh token' }, { status: 401 })
    }

    // Check if it's a refresh token
    if ((payload as any).type !== 'refresh') {
      return Response.json({ error: 'Invalid refresh token' }, { status: 401 })
    }

    // Get user
    const user = await getUserById(env.DB, payload.userId)
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const { password_hash, ...userWithoutPassword } = user
    const tokens = generateToken(
      userWithoutPassword.id,
      userWithoutPassword.email,
      userWithoutPassword.name,
      userWithoutPassword.role,
      jwtSecret
    )

    return Response.json(
      {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    )
  } catch (error) {
    console.error('Refresh error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/auth/verify
 * Verify if token is still valid
 */
export async function verifyHandler(request: Request, env: Env): Promise<Response> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({ valid: false }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const jwtSecret = env.JWT_SECRET || 'empire-secret-key'
    const payload = verifyJwtToken(token, jwtSecret)

    if (!payload) {
      return Response.json({ valid: false }, { status: 401 })
    }

    const user = await getUserById(env.DB, payload.userId)
    if (!user) {
      return Response.json({ valid: false }, { status: 404 })
    }

    const { password_hash, ...userWithoutPassword } = user

    return Response.json(
      {
        valid: true,
        user: userWithoutPassword,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    )
  } catch (error) {
    console.error('Verify error:', error)
    return Response.json({ valid: false, error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/auth/logout
 * Logout (client-side token invalidation)
 */
export async function logoutHandler(request: Request, env: Env): Promise<Response> {
  // In a stateless JWT system, logout is handled client-side
  // In production, you might implement a token blacklist in KV store
  return Response.json({ message: 'Logged out successfully' }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

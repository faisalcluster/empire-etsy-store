/**
 * JWT Token Management
 * Simplified JWT implementation for Workers
 */

import type { JwtPayload, TokenPair } from './types'

const ACCESS_TOKEN_EXPIRY = 24 * 60 * 60 // 24 hours in seconds
const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 // 7 days in seconds

/**
 * Base64 encode
 */
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Base64 decode
 */
function base64UrlDecode(str: string): string {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'))
}

/**
 * Simplified JWT generation (HMAC-SHA256)
 */
export async function generateToken(
  userId: string,
  email: string,
  name: string,
  role: 'admin' | 'manager' | 'viewer',
  secret: string
): Promise<TokenPair> {
  const now = Math.floor(Date.now() / 1000)

  const payload: JwtPayload = {
    userId,
    email,
    name,
    role,
    iat: now,
    exp: now + ACCESS_TOKEN_EXPIRY,
  }

  const header = { alg: 'HS256', typ: 'JWT' }
  const headerEncoded = base64UrlEncode(JSON.stringify(header))
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload))

  // Create signature
  const data = `${headerEncoded}.${payloadEncoded}`
  const keyData = new TextEncoder().encode(secret)
  const dataBuffer = new TextEncoder().encode(data)

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, dataBuffer)
  const signatureArray = new Uint8Array(signature)
  const signatureBase64 = btoa(String.fromCharCode(...signatureArray))
  const signatureEncoded = signatureBase64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const accessToken = `${data}.${signatureEncoded}`

  // Refresh token
  const refreshPayload = {
    userId,
    type: 'refresh',
    exp: now + REFRESH_TOKEN_EXPIRY,
  }
  const refreshPayloadEncoded = base64UrlEncode(JSON.stringify(refreshPayload))
  const refreshData = `${headerEncoded}.${refreshPayloadEncoded}`

  const refreshSignature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(refreshData))
  const refreshSignatureArray = new Uint8Array(refreshSignature)
  const refreshSignatureBase64 = btoa(String.fromCharCode(...refreshSignatureArray))
  const refreshSignatureEncoded = refreshSignatureBase64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')

  const refreshToken = `${refreshData}.${refreshSignatureEncoded}`

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TOKEN_EXPIRY * 1000,
  }
}

/**
 * Verify JWT token
 */
export async function verifyToken(
  token: string,
  secret: string
): Promise<JwtPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const [headerEncoded, payloadEncoded, signature] = parts

    // Verify signature
    const data = `${headerEncoded}.${payloadEncoded}`
    const keyData = new TextEncoder().encode(secret)
    const dataBuffer = new TextEncoder().encode(data)

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const signatureBuffer = new Uint8Array(atob(signature.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => c.charCodeAt(0)))

    const isValid = await crypto.subtle.verify('HMAC', key, signatureBuffer, dataBuffer)

    if (!isValid) return null

    const payload = JSON.parse(base64UrlDecode(payloadEncoded)) as JwtPayload

    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null

    return payload
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  if (!authHeader.startsWith('Bearer ')) return null
  return authHeader.substring(7)
}

/**
 * Check if token is expired
 */
export function isTokenExpired(payload: JwtPayload): boolean {
  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}

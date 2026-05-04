/**
 * Authentication Types
 */

export interface JwtPayload {
  userId: string
  email: string
  name: string
  role: 'admin' | 'manager' | 'viewer'
  iat: number
  exp: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthRequest {
  email: string
  password: string
}

export interface RegisterRequest extends AuthRequest {
  name: string
  role?: 'admin' | 'manager' | 'viewer'
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    role: 'admin' | 'manager' | 'viewer'
    avatar_url: string | null
  }
  tokens: TokenPair
}

export interface RefreshTokenResponse {
  accessToken: string
  expiresIn: number
}

export interface VerifyTokenResponse {
  valid: boolean
  user?: {
    id: string
    email: string
    name: string
    role: 'admin' | 'manager' | 'viewer'
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    name: string
    role: 'admin' | 'manager' | 'viewer'
    avatar_url: string | null
  }
}

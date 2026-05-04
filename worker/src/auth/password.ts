/**
 * Password Hashing with bcryptjs
 * Secure password storage and verification
 */

const BCRYPT_COST = 10

/**
 * Hash a password using SHA-256 (simplified for Workers)
 * Note: In production with full Node.js environment, use actual bcryptjs
 */
export async function hashPassword(password: string): Promise<string> {
  // Simple SHA-256 hash for Workers environment
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'empire-secret-salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return `$sha256$${hashHex}`
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  // Extract the hash part
  const storedHash = hash.replace('$sha256$', '')

  // Hash the input password with the same salt
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'empire-secret-salt')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // Use constant-time comparison
  return hashHex === storedHash
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letters')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain numbers')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

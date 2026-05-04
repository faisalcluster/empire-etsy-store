/**
 * Team Routes
 * Team member management
 */

import type { Env } from '../worker'
import { checkStoreMembership, cors } from '../auth/middleware'
import { addStoreMember, getStoreMembers, removeStoreMember } from '../db/queries'
import { getUserByEmail } from '../db/queries'

/**
 * GET /api/team/store/:storeId
 * Get all team members for a store
 */
export async function getTeamHandler(request: Request, env: Env): Promise<Response> {
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

    const members = await getStoreMembers(env.DB, storeId)

    return Response.json({ members }, { headers: cors })
  } catch (error) {
    console.error('Get team error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/team/invite
 * Invite new team member
 */
export async function inviteMemberHandler(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const storeId = url.searchParams.get('storeId') || ''
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

    // Only admins and managers can invite
    if (role !== 'admin' && role !== 'manager') {
      return Response.json({ error: 'Access denied' }, { status: 403, headers: cors })
    }

    const { email, name, memberRole = 'viewer' } = await request.json()

    if (!email || !name) {
      return Response.json({ error: 'Email and name required' }, { status: 400, headers: cors })
    }

    // Check if user exists
    const existingUser = await getUserByEmail(env.DB, email)
    if (!existingUser) {
      return Response.json(
        { error: 'User not found. Please ask them to register first.' },
        { status: 404, headers: cors }
      )
    }

    // Check if already a member
    const existingMember = await env.DB
      .prepare(`SELECT * FROM store_members WHERE store_id = ? AND user_id = ?`)
      .bind(storeId, existingUser.id)
      .first()

    if (existingMember) {
      return Response.json({ error: 'User is already a team member' }, { status: 409, headers: cors })
    }

    // Add as member
    const member = await addStoreMember(env.DB, {
      store_id: storeId,
      user_id: existingUser.id,
      role: memberRole as 'admin' | 'manager' | 'viewer',
      invited_by: user.id,
    })

    return Response.json({ member }, { status: 201, headers: cors })
  } catch (error) {
    console.error('Invite member error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/team/:memberId
 * Remove team member
 */
export async function removeMemberHandler(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const memberId = url.pathname.split('/').pop() || ''
    const cors = cors()

    if (!memberId) {
      return Response.json({ error: 'Member ID required' }, { status: 400, headers: cors })
    }

    // Get member info
    const member = await env.DB
      .prepare(`SELECT * FROM store_members WHERE id = ?`)
      .bind(memberId)
      .first<{ store_id: string; user_id: string; role: string }>()

    if (!member) {
      return Response.json({ error: 'Member not found' }, { status: 404, headers: cors })
    }

    // Auth check
    const authResult = await checkStoreMembership(request, env, member.store_id)
    if (authResult instanceof Response) {
      return authResult
    }

    const { user, role } = authResult

    // Only admins can remove members
    if (role !== 'admin') {
      return Response.json({ error: 'Access denied' }, { status: 403, headers: cors })
    }

    // Can't remove yourself
    if (user.id === member.user_id) {
      return Response.json(
        { error: 'Cannot remove yourself from the team' },
        { status: 400, headers: cors }
      )
    }

    // Can't remove other admins
    if (member.role === 'admin') {
      return Response.json(
        { error: 'Cannot remove other admins' },
        { status: 403, headers: cors }
      )
    }

    await removeStoreMember(env.DB, member.store_id, member.user_id)

    return Response.json({ message: 'Member removed' }, { headers: cors })
  } catch (error) {
    console.error('Remove member error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/team/:memberId/role
 * Update member role
 */
export async function updateMemberRoleHandler(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url)
    const memberId = url.pathname.split('/').slice(-2, -1)[0] || ''
    const cors = cors()

    if (!memberId) {
      return Response.json({ error: 'Member ID required' }, { status: 400, headers: cors })
    }

    // Get member info
    const member = await env.DB
      .prepare(`SELECT * FROM store_members WHERE id = ?`)
      .bind(memberId)
      .first<{ store_id: string; user_id: string; role: string }>()

    if (!member) {
      return Response.json({ error: 'Member not found' }, { status: 404, headers: cors })
    }

    // Auth check
    const authResult = await checkStoreMembership(request, env, member.store_id)
    if (authResult instanceof Response) {
      return authResult
    }

    const { user, role } = authResult

    // Only admins can update roles
    if (role !== 'admin') {
      return Response.json({ error: 'Access denied' }, { status: 403, headers: cors })
    }

    const { newRole } = await request.json()

    if (!newRole || !['admin', 'manager', 'viewer'].includes(newRole)) {
      return Response.json({ error: 'Invalid role' }, { status: 400, headers: cors })
    }

    // Can't change your own role
    if (user.id === member.user_id) {
      return Response.json(
        { error: 'Cannot change your own role' },
        { status: 400, headers: cors }
      )
    }

    // Can't demote other admins
    if (member.role === 'admin' && newRole !== 'admin') {
      return Response.json(
        { error: 'Cannot demote other admins' },
        { status: 403, headers: cors })
    }

    await env.DB
      .prepare(`UPDATE store_members SET role = ? WHERE id = ?`)
      .bind(newRole, memberId)
      .run()

    return Response.json({ message: 'Role updated' }, { headers: cors })
  } catch (error) {
    console.error('Update member role error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

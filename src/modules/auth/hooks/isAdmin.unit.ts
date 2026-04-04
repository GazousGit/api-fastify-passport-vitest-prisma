import { vi, describe, it, expect } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { isAdmin } from './isAdmin.js'

function makeRequest(authenticated: boolean, role: 'User' | 'Admin' = 'User'): FastifyRequest {
  return {
    isAuthenticated: () => authenticated,
    user: { id: 'user-1', role },
  } as unknown as FastifyRequest
}

function makeReply() {
  const reply = {
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  }
  return reply as unknown as FastifyReply
}

describe('modules -> auth -> hooks -> isAdmin', () => {
  it('should call next when authenticated as Admin', async () => {
    const request = makeRequest(true, 'Admin')
    const reply = makeReply()

    await isAdmin(request, reply)

    expect(reply.code).not.toHaveBeenCalled()
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('should return 401 when not authenticated', async () => {
    const request = makeRequest(false)
    const reply = makeReply()

    await isAdmin(request, reply)

    expect(reply.code).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }))
  })

  it('should return 403 when authenticated but not Admin', async () => {
    const request = makeRequest(true, 'User')
    const reply = makeReply()

    await isAdmin(request, reply)

    expect(reply.code).toHaveBeenCalledWith(403)
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }))
  })
})

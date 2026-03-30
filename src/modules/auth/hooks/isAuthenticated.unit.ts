import { vi, describe, it, expect } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { isAuthenticated } from './isAuthenticated.js'

function makeRequest(authenticated: boolean): FastifyRequest {
  return { isAuthenticated: () => authenticated } as unknown as FastifyRequest
}

function makeReply() {
  const reply = {
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  }
  return reply as unknown as FastifyReply
}

describe('modules -> auth -> hooks -> isAuthenticated', () => {
  it('should call next when authenticated', async () => {
    const request = makeRequest(true)
    const reply = makeReply()

    await isAuthenticated(request, reply)

    expect(reply.code).not.toHaveBeenCalled()
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('should return 401 when not authenticated', async () => {
    const request = makeRequest(false)
    const reply = makeReply()

    await isAuthenticated(request, reply)

    expect(reply.code).toHaveBeenCalledWith(401)
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 }),
    )
  })
})

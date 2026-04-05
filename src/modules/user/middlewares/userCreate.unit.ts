import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { userCreate } from './userCreate.js'

function makeReply(): FastifyReply {
  const reply = { code: vi.fn(), send: vi.fn() } as unknown as FastifyReply
  vi.mocked(reply.code).mockReturnValue(reply)
  return reply
}

function makeRequest(body: unknown): FastifyRequest {
  return { body } as FastifyRequest
}

beforeEach(() => vi.clearAllMocks())

describe('userCreate', () => {
  it('passes for a valid body with email only', async () => {
    const reply = makeReply()
    await userCreate(makeRequest({ email: 'alice@example.com' }), reply)
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('passes for a valid body with email and names', async () => {
    const reply = makeReply()
    await userCreate(
      makeRequest({ email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' }),
      reply,
    )
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid email', async () => {
    const reply = makeReply()
    await userCreate(makeRequest({ email: 'not-an-email' }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  it('returns 400 when email is missing', async () => {
    const reply = makeReply()
    await userCreate(makeRequest({ name: 'Alice' }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })
})

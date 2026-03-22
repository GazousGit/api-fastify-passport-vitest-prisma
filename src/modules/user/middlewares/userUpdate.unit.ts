import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { userUpdate } from './userUpdate.js'

function makeReply(): FastifyReply {
  const reply = { code: vi.fn(), send: vi.fn() } as unknown as FastifyReply
  vi.mocked(reply.code).mockReturnValue(reply)
  return reply
}

function makeRequest(params: unknown, body: unknown): FastifyRequest {
  return { params, body } as FastifyRequest
}

beforeEach(() => vi.clearAllMocks())

describe('userUpdate', () => {
  it('passes for valid params and body', async () => {
    const reply = makeReply()
    await userUpdate(makeRequest({ id: 'cuid-1' }, { email: 'alice@example.com', firstName: 'Alice' }), reply)
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid id', async () => {
    const reply = makeReply()
    await userUpdate(makeRequest({ id: '' }, { email: 'alice@example.com' }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })

  it('returns 400 when email is missing from the body', async () => {
    const reply = makeReply()
    await userUpdate(makeRequest({ id: 'cuid-1' }, { name: 'Alice' }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })

  it('returns 400 for an invalid email', async () => {
    const reply = makeReply()
    await userUpdate(makeRequest({ id: 'cuid-1' }, { email: 'bad' }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })
})

import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { userPatch } from './userPatch.js'

function makeReply(): FastifyReply {
  const reply = { code: vi.fn(), send: vi.fn() } as unknown as FastifyReply
  vi.mocked(reply.code).mockReturnValue(reply)
  return reply
}

function makeRequest(params: unknown, body: unknown): FastifyRequest {
  return { params, body } as FastifyRequest
}

beforeEach(() => vi.clearAllMocks())

describe('userPatch', () => {
  it('passes with only email in body', async () => {
    const reply = makeReply()
    await userPatch(makeRequest({ id: 'cuid-1' }, { email: 'alice@example.com' }), reply)
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('passes with only firstName in body', async () => {
    const reply = makeReply()
    await userPatch(makeRequest({ id: 'cuid-1' }, { firstName: 'Alice' }), reply)
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid id', async () => {
    const reply = makeReply()
    await userPatch(makeRequest({ id: '' }, { name: 'Alice' }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })

  it('returns 400 for an empty body', async () => {
    const reply = makeReply()
    await userPatch(makeRequest({ id: 'cuid-1' }, {}), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })

  it('returns 400 for an invalid email format', async () => {
    const reply = makeReply()
    await userPatch(makeRequest({ id: 'cuid-1' }, { email: 'bad' }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })
})

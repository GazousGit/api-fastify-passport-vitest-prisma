import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { userGetById } from './userGetById.js'

function makeReply(): FastifyReply {
  const reply = { code: vi.fn(), send: vi.fn() } as unknown as FastifyReply
  vi.mocked(reply.code).mockReturnValue(reply)
  return reply
}

function makeRequest(params: unknown): FastifyRequest {
  return { params } as FastifyRequest
}

beforeEach(() => vi.clearAllMocks())

describe('userGetById', () => {
  it('passes for a valid non-empty id', async () => {
    const reply = makeReply()
    await userGetById(makeRequest({ id: 'cuid-1' }), reply)
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('returns 400 for an empty id', async () => {
    const reply = makeReply()
    await userGetById(makeRequest({ id: '' }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  it('returns 400 when id is missing', async () => {
    const reply = makeReply()
    await userGetById(makeRequest({}), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })
})

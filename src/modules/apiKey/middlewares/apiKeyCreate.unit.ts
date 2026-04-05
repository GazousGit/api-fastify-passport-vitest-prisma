import { vi, describe, it, expect, beforeEach } from 'vitest'
import { makeReply, makeRequest } from '../../../test-utils/middleware.js'
import { apiKeyCreate } from './apiKeyCreate.js'

beforeEach(() => vi.clearAllMocks())

describe('modules -> apiKey -> middlewares -> apiKeyCreate', () => {
  it('passes for a valid body with name only', async () => {
    const reply = makeReply()
    await apiKeyCreate(makeRequest({ body: { name: 'My Key' } }), reply)
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('passes for a valid body with all optional fields', async () => {
    const reply = makeReply()
    await apiKeyCreate(
      makeRequest({ body: { name: 'My Key', scopes: ['read', 'write'], expiresAt: '2026-01-01T00:00:00Z' } }),
      reply,
    )
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('returns 400 when name is missing', async () => {
    const reply = makeReply()
    await apiKeyCreate(makeRequest({ body: { scopes: ['read'] } }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  it('returns 400 when name is empty', async () => {
    const reply = makeReply()
    await apiKeyCreate(makeRequest({ body: { name: '' } }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })

  it('returns 400 when scopes is not an array', async () => {
    const reply = makeReply()
    await apiKeyCreate(makeRequest({ body: { name: 'My Key', scopes: 'read' } }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })
})

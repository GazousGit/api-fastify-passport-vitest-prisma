import { vi, describe, it, expect, beforeEach } from 'vitest'
import { makeReply, makeRequest } from '../../../test-utils/middleware.js'
import { apiKeyIdParam } from './apiKeyIdParam.js'

beforeEach(() => vi.clearAllMocks())

describe('modules -> apiKey -> middlewares -> apiKeyIdParam', () => {
  it('passes for a valid id', async () => {
    const reply = makeReply()
    await apiKeyIdParam(makeRequest({ params: { id: 'key-uuid-1' } }), reply)
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('returns 400 when id is missing', async () => {
    const reply = makeReply()
    await apiKeyIdParam(makeRequest({ params: {} }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  it('returns 400 when id is empty string', async () => {
    const reply = makeReply()
    await apiKeyIdParam(makeRequest({ params: { id: '' } }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })
})

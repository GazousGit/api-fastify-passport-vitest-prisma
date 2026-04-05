import { vi, describe, it, expect, beforeEach } from 'vitest'
import { makeReply, makeRequest } from '../../../test-utils/middleware.js'
import { userDelete } from './userDelete.js'

beforeEach(() => vi.clearAllMocks())

describe('userDelete', () => {
  it('passes for a valid non-empty id', async () => {
    const reply = makeReply()
    await userDelete(makeRequest({ params: { id: 'cuid-1' } }), reply)
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('returns 400 for an empty id', async () => {
    const reply = makeReply()
    await userDelete(makeRequest({ params: { id: '' } }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  it('returns 400 when id is missing', async () => {
    const reply = makeReply()
    await userDelete(makeRequest({ params: {} }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })
})

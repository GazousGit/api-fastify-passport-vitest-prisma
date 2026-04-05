import { vi, describe, it, expect, beforeEach } from 'vitest'
import { makeReply, makeRequest } from '../../../test-utils/middleware.js'
import { userPatch } from './userPatch.js'

beforeEach(() => vi.clearAllMocks())

describe('userPatch', () => {
  it('passes with only email in body', async () => {
    const reply = makeReply()
    await userPatch(makeRequest({ params: { id: 'cuid-1' }, body: { email: 'alice@example.com' } }), reply)
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('passes with only firstName in body', async () => {
    const reply = makeReply()
    await userPatch(makeRequest({ params: { id: 'cuid-1' }, body: { firstName: 'Alice' } }), reply)
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid id', async () => {
    const reply = makeReply()
    await userPatch(makeRequest({ params: { id: '' }, body: { name: 'Alice' } }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })

  it('returns 400 for an empty body', async () => {
    const reply = makeReply()
    await userPatch(makeRequest({ params: { id: 'cuid-1' }, body: {} }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })

  it('returns 400 for an invalid email format', async () => {
    const reply = makeReply()
    await userPatch(makeRequest({ params: { id: 'cuid-1' }, body: { email: 'bad' } }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })
})

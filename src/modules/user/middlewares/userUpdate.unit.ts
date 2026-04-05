import { vi, describe, it, expect, beforeEach } from 'vitest'
import { makeReply, makeRequest } from '../../../test-utils/middleware.js'
import { userUpdate } from './userUpdate.js'

beforeEach(() => vi.clearAllMocks())

describe('userUpdate', () => {
  it('passes for valid params and body', async () => {
    const reply = makeReply()
    await userUpdate(
      makeRequest({ params: { id: 'cuid-1' }, body: { email: 'alice@example.com', firstName: 'Alice' } }),
      reply,
    )
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid id', async () => {
    const reply = makeReply()
    await userUpdate(makeRequest({ params: { id: '' }, body: { email: 'alice@example.com' } }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })

  it('returns 400 when email is missing from the body', async () => {
    const reply = makeReply()
    await userUpdate(makeRequest({ params: { id: 'cuid-1' }, body: { name: 'Alice' } }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })

  it('returns 400 for an invalid email', async () => {
    const reply = makeReply()
    await userUpdate(makeRequest({ params: { id: 'cuid-1' }, body: { email: 'bad' } }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })
})

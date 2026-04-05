import { vi, describe, it, expect, beforeEach } from 'vitest'
import { makeReply, makeRequest } from '../../../test-utils/middleware.js'
import { userCreate } from './userCreate.js'

beforeEach(() => vi.clearAllMocks())

describe('userCreate', () => {
  it('passes for a valid body with email only', async () => {
    const reply = makeReply()
    await userCreate(makeRequest({ body: { email: 'alice@example.com' } }), reply)
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('passes for a valid body with email and names', async () => {
    const reply = makeReply()
    await userCreate(
      makeRequest({ body: { email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' } }),
      reply,
    )
    expect(reply.send).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid email', async () => {
    const reply = makeReply()
    await userCreate(makeRequest({ body: { email: 'not-an-email' } }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
    expect(reply.send).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }))
  })

  it('returns 400 when email is missing', async () => {
    const reply = makeReply()
    await userCreate(makeRequest({ body: { name: 'Alice' } }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
  })
})

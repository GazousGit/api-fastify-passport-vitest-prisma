import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { createUser } from './createUser.js'

beforeEach(async () => {
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('modules -> user -> services -> createUser', () => {
  it('should persist a user with only email', async () => {
    const user = await createUser({ email: 'alice@example.com' })

    expect(user.email).toBe('alice@example.com')
    expect(user.id).toBeDefined()
    expect(user.role).toBe('User')
    expect(user.emailVerified).toBe(false)
    expect(user.firstName).toBeNull()
  })

  it('should persist optional fields when provided', async () => {
    const user = await createUser({
      email: 'alice@example.com',
      firstName: 'Alice',
      lastName: 'Smith',
      userName: 'alice',
      mobilePhone: '+33600000001',
    })

    expect(user.firstName).toBe('Alice')
    expect(user.lastName).toBe('Smith')
    expect(user.userName).toBe('alice')
    expect(user.mobilePhone).toBe('+33600000001')
  })

  it('should throw on duplicate email', async () => {
    await createUser({ email: 'alice@example.com' })

    await expect(createUser({ email: 'alice@example.com' })).rejects.toThrow()
  })

  it('should throw on duplicate userName', async () => {
    await createUser({ email: 'alice@example.com', userName: 'alice' })

    await expect(
      createUser({ email: 'bob@example.com', userName: 'alice' }),
    ).rejects.toThrow()
  })
})

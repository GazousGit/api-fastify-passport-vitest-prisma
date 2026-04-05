import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { register } from './register.js'

beforeEach(async () => {
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('modules -> auth -> services -> register', () => {
  it('should persist user and localAuth with a hashed password', async () => {
    const user = await register({ email: 'alice@example.com', password: 'Password1!' })

    expect(user.email).toBe('alice@example.com')
    expect(user.id).toBeDefined()

    const localAuth = await prisma.localAuth.findUnique({ where: { userId: user.id } })
    expect(localAuth).not.toBeNull()
    expect(localAuth!.passwordHash).not.toBe('Password1!')
    expect(localAuth!.passwordHash).toMatch(/^\$argon2/)
  })

  it('should persist optional fields when provided', async () => {
    const user = await register({
      email: 'alice@example.com',
      password: 'Password1!',
      firstName: 'Alice',
      lastName: 'Smith',
    })

    expect(user.firstName).toBe('Alice')
    expect(user.lastName).toBe('Smith')
  })

  it('should throw on duplicate email', async () => {
    await register({ email: 'alice@example.com', password: 'Password1!' })

    await expect(register({ email: 'alice@example.com', password: 'Password1!' })).rejects.toThrow()
  })

  it('should throw 400 for a weak password', async () => {
    await expect(register({ email: 'alice@example.com', password: 'weak' })).rejects.toMatchObject({
      statusCode: 400,
    })

    expect(await prisma.user.count()).toBe(0)
  })
})

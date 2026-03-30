import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { patchUser } from './patchUser.js'

beforeEach(async () => {
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('modules -> user -> services -> patchUser', () => {
  it('should update only the provided fields', async () => {
    const created = await prisma.user.create({
      data: { email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' },
    })

    const patched = await patchUser(created.id, { firstName: 'Alicia' })

    expect(patched.firstName).toBe('Alicia')
    // Fields not in the patch must be untouched
    expect(patched.email).toBe('alice@example.com')
    expect(patched.lastName).toBe('Smith')
  })

  it('should set a field to null when explicitly passed null', async () => {
    const created = await prisma.user.create({
      data: { email: 'alice@example.com', firstName: 'Alice' },
    })

    const patched = await patchUser(created.id, { firstName: null })

    expect(patched.firstName).toBeNull()
  })
})

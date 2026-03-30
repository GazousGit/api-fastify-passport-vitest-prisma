import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { updateUser } from './updateUser.js'

beforeEach(async () => {
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('modules -> user -> services -> updateUser', () => {
  it('should update all provided fields', async () => {
    const created = await prisma.user.create({
      data: { email: 'alice@example.com', firstName: 'Alice' },
    })

    const updated = await updateUser(created.id, {
      email: 'alice-new@example.com',
      firstName: 'Alicia',
      lastName: 'Smith',
    })

    expect(updated.email).toBe('alice-new@example.com')
    expect(updated.firstName).toBe('Alicia')
    expect(updated.lastName).toBe('Smith')
  })

  it('should null out omitted nullable fields (PUT semantics)', async () => {
    const created = await prisma.user.create({
      data: { email: 'alice@example.com', firstName: 'Alice', lastName: 'Smith' },
    })

    // PUT with only email — firstName and lastName should be cleared
    const updated = await updateUser(created.id, { email: 'alice@example.com' })

    expect(updated.firstName).toBeNull()
    expect(updated.lastName).toBeNull()
  })
})

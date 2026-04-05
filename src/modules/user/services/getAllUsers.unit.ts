import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { getAllUsers } from './getAllUsers.js'

beforeEach(async () => {
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('modules -> user -> services -> getAllUsers', () => {
  it('should return an empty array when there are no users', async () => {
    const users = await getAllUsers()

    expect(users).toEqual([])
  })

  it('should return all persisted users', async () => {
    await prisma.user.createMany({
      data: [
        { email: 'alice@example.com' },
        { email: 'bob@example.com' },
      ],
    })

    const users = await getAllUsers()

    expect(users).toHaveLength(2)
    expect(users.map((u) => u.email)).toEqual(
      expect.arrayContaining(['alice@example.com', 'bob@example.com']),
    )
  })
})

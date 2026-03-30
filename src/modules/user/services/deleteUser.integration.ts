import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { deleteUser } from './deleteUser.js'

beforeEach(async () => {
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('modules -> user -> services -> deleteUser', () => {
  it('should remove the user from the database', async () => {
    const created = await prisma.user.create({ data: { email: 'alice@example.com' } })

    await deleteUser(created.id)

    const found = await prisma.user.findUnique({ where: { id: created.id } })
    expect(found).toBeNull()
  })

  it('should throw when the user does not exist', async () => {
    await expect(deleteUser('00000000-0000-7000-8000-000000000000')).rejects.toThrow()
  })
})

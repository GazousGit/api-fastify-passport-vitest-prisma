import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { prisma } from '../../../core/prisma.js'
import { getUserById } from './getUserById.js'

beforeEach(async () => {
  await prisma.user.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('modules -> user -> services -> getUserById', () => {
  it('should return the user when found', async () => {
    const created = await prisma.user.create({ data: { email: 'alice@example.com' } })

    const user = await getUserById(created.id)

    expect(user.id).toBe(created.id)
    expect(user.email).toBe('alice@example.com')
  })

  it('should throw 404 when the user does not exist', async () => {
    await expect(getUserById('00000000-0000-7000-8000-000000000000')).rejects.toMatchObject({
      statusCode: 404,
    })
  })
})

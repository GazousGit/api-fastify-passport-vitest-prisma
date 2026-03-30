import argon2 from 'argon2'
import { prisma } from '../../../core/prisma.js'
import { isStrongPassword } from '../helpers/isStrongPassword.js'
import type { User } from '../../user/type.js'
import type { RegisterInput } from '../type.js'

export async function register(input: RegisterInput): Promise<User> {
  if (!isStrongPassword(input.password)) {
    throw Object.assign(
      new Error(
        'Password must be at least 8 characters and include 1 uppercase, 1 lowercase, 1 digit, and 1 symbol',
      ),
      { statusCode: 400 },
    )
  }

  const passwordHash = await argon2.hash(input.password)

  return prisma.user.create({
    data: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      localAuth: {
        create: { passwordHash },
      },
    },
  })
}

import argon2 from 'argon2'
import { prisma } from '../../../core/prisma.js'
import type { User } from '../../user/type.js'

export async function login(email: string, password: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { localAuth: true },
  })

  if (!user?.localAuth) return null

  const valid = await argon2.verify(user.localAuth.passwordHash, password)
  if (!valid) return null

  // Strip localAuth (contains passwordHash)
  // TODO will need to think about best return from login
  // like a isAuthenticated=true or just use lodash omit maybe ?
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { localAuth: _localAuth, ...safeUser } = user
  return safeUser
}

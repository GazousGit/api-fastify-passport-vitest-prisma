import { prisma } from '../../../core/prisma.js'
import type { User } from '../../user/type.js'

export interface OAuthUserInput {
  provider: string
  providerAccountId: string
  email?: string
  emailVerified?: boolean
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: Date
}

export async function findOrCreateOAuthUser(input: OAuthUserInput): Promise<User> {
  // OAuthAccount exists → return user
  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: input.provider,
        providerAccountId: input.providerAccountId,
      },
    },
    include: { user: true },
  })

  if (existingAccount) {
    await prisma.oAuthAccount.update({
      where: { id: existingAccount.id },
      data: {
        accessToken: input.accessToken,
        refreshToken: input.refreshToken,
        tokenExpiresAt: input.tokenExpiresAt,
      },
    })
    return existingAccount.user
  }

  // 2. Email matche an user → link oAuthAccount to user
  if (input.email) {
    const existingUser = await prisma.user.findUnique({ where: { email: input.email } })

    if (existingUser) {
      await prisma.oAuthAccount.create({
        data: {
          userId: existingUser.id,
          provider: input.provider,
          providerAccountId: input.providerAccountId,
          accessToken: input.accessToken,
          refreshToken: input.refreshToken,
          tokenExpiresAt: input.tokenExpiresAt,
        },
      })

      // Mark email as verified if the provider confirmed it
      if (input.emailVerified && !existingUser.emailVerified) {
        return prisma.user.update({
          where: { id: existingUser.id },
          data: { emailVerified: true },
        })
      }

      return existingUser
    }
  }

  // 3. No match → create new user
  return prisma.user.create({
    data: {
      email: input.email ?? `${input.provider}.${input.providerAccountId}@oauth.local`,
      emailVerified: input.emailVerified ?? false,
      oauthAccounts: {
        create: {
          provider: input.provider,
          providerAccountId: input.providerAccountId,
          accessToken: input.accessToken,
          refreshToken: input.refreshToken,
          tokenExpiresAt: input.tokenExpiresAt,
        },
      },
    },
  })
}

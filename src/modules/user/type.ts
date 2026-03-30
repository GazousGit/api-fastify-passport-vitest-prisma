import type { z } from 'zod'
import type { Role } from '@prisma/client'
import type {
  createUserSchema,
  updateUserSchema,
  patchUserSchema,
  userIdParamSchema,
} from './model.js'

export type UserRole = Role

export interface User {
  id: string
  email: string
  emailVerified: boolean
  firstName: string | null
  lastName: string | null
  userName: string | null
  mobilePhone: string | null
  mobilePhoneVerified: boolean
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type PatchUserInput = z.infer<typeof patchUserSchema>
export type UserIdParam = z.infer<typeof userIdParamSchema>

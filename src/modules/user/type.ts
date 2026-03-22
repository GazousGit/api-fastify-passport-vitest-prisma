import type { z } from 'zod'
import type {
  createUserSchema,
  updateUserSchema,
  patchUserSchema,
  userIdParamSchema,
} from './model.js'

export interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type PatchUserInput = z.infer<typeof patchUserSchema>
export type UserIdParam = z.infer<typeof userIdParamSchema>

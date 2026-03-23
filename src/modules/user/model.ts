import { z } from 'zod'

export const userIdParamSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
})

export const createUserSchema = z.object({
  email: z.email(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  userName: z.string().min(1).max(50).optional(),
  mobilePhone: z.string().min(1).max(20).optional(),
})

// PUT — all fields required
export const updateUserSchema = z.object({
  email: z.email(),
  firstName: z.string().min(1).max(100).nullable().optional(),
  lastName: z.string().min(1).max(100).nullable().optional(),
  userName: z.string().min(1).max(50).nullable().optional(),
  mobilePhone: z.string().min(1).max(20).nullable().optional(),
})

// PATCH — at least one field required (is it really interesting to have PUT & PATCH (need to invvestigate the use cases))
export const patchUserSchema = z
  .object({
    email: z.email().optional(),
    firstName: z.string().min(1).max(100).nullable().optional(),
    lastName: z.string().min(1).max(100).nullable().optional(),
    userName: z.string().min(1).max(50).nullable().optional(),
    mobilePhone: z.string().min(1).max(20).nullable().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field must be provided',
  })

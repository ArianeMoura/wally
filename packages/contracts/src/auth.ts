import { z } from 'zod'
import { email, password } from './common'
import { userPublic } from './users'

export const signUpBody = z.object({
  name: z.string().min(1).max(120),
  email,
  password,
})

export const signInBody = z.object({
  email,
  password: z.string().min(1), // no login não revalidamos regras de força
})

export const refreshBody = z.object({
  refreshToken: z.string().min(1),
})

export const forgotPasswordBody = z.object({ email })

export const resetPasswordBody = z.object({
  token: z.string().min(1),
  password,
})

/** Par de tokens + usuário autenticado. */
export const authResponse = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userPublic,
})

export type SignUpBody = z.infer<typeof signUpBody>
export type SignInBody = z.infer<typeof signInBody>
export type RefreshBody = z.infer<typeof refreshBody>
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBody>
export type ResetPasswordBody = z.infer<typeof resetPasswordBody>
export type AuthResponse = z.infer<typeof authResponse>

import argon2 from 'argon2'
import { randomUUID } from 'node:crypto'
import { and, eq, isNull } from 'drizzle-orm'
import type {
  AuthResponse,
  SignUpBody,
  SignInBody,
  UserPublic,
} from '@wally/contracts'
import { db } from '../../db/client'
import { users } from '../../db/schema/users'
import { refreshTokens, passwordResetTokens } from '../../db/schema/auth'
import { env } from '../../config/env'
import {
  ConflictError,
  UnauthorizedError,
  BadRequestError,
} from '../../http/errors'
import { generateOpaqueToken, hashToken, expiryFrom } from './tokens'

export interface AuthServiceDeps {
  /** Assina um access token curto para o usuário (injeta o `app.jwt`). */
  signAccessToken: (userId: string) => string
}

type UserRow = typeof users.$inferSelect

function toUserPublic(u: UserRow): UserPublic {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatarUrl ?? null,
    aiConsentAt: u.aiConsentAt ? u.aiConsentAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
  }
}

// Hash "descartável" para equalizar o tempo de resposta quando o e-mail não
// existe (mitiga enumeração de usuários por timing no login).
let dummyHashPromise: Promise<string> | null = null
function dummyHash(): Promise<string> {
  dummyHashPromise ??= argon2.hash('wally-timing-guard', {
    type: argon2.argon2id,
  })
  return dummyHashPromise
}

export class AuthService {
  constructor(private readonly deps: AuthServiceDeps) {}

  private async issueTokens(
    userId: string,
    familyId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = generateOpaqueToken()
    await db.insert(refreshTokens).values({
      userId,
      tokenHash: hashToken(refreshToken, env.JWT_REFRESH_SECRET),
      familyId,
      expiresAt: expiryFrom(env.REFRESH_TOKEN_TTL, Date.now()),
    })
    return { accessToken: this.deps.signAccessToken(userId), refreshToken }
  }

  async me(userId: string): Promise<UserPublic> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1)
    if (!user) throw new UnauthorizedError('Usuário inválido')
    return toUserPublic(user)
  }

  async signUp(body: SignUpBody): Promise<AuthResponse> {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1)
    if (existing.length > 0) {
      throw new ConflictError('E-mail já cadastrado')
    }

    const passwordHash = await argon2.hash(body.password, {
      type: argon2.argon2id,
    })
    const [user] = await db
      .insert(users)
      .values({ name: body.name, email: body.email, passwordHash })
      .returning()

    const tokens = await this.issueTokens(user!.id, randomUUID())
    return { ...tokens, user: toUserPublic(user!) }
  }

  async signIn(body: SignInBody): Promise<AuthResponse> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.email, body.email), isNull(users.deletedAt)))
      .limit(1)

    if (!user) {
      await argon2.verify(await dummyHash(), body.password).catch(() => false)
      throw new UnauthorizedError('Credenciais inválidas')
    }

    const ok = await argon2
      .verify(user.passwordHash, body.password)
      .catch(() => false)
    if (!ok) throw new UnauthorizedError('Credenciais inválidas')

    const tokens = await this.issueTokens(user.id, randomUUID())
    return { ...tokens, user: toUserPublic(user) }
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const tokenHash = hashToken(refreshToken, env.JWT_REFRESH_SECRET)
    const [row] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1)

    if (!row) throw new UnauthorizedError('Refresh token inválido')

    // Reúso de um token já rotacionado ⇒ indício de vazamento: revoga a família.
    if (row.revokedAt) {
      await this.revokeFamily(row.familyId)
      throw new UnauthorizedError('Refresh token reutilizado — sessão revogada')
    }
    if (row.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedError('Refresh token expirado')
    }

    // Rotação: marca o atual como usado e emite um novo na mesma família.
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.id, row.id))

    const [user] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, row.userId), isNull(users.deletedAt)))
      .limit(1)
    if (!user) throw new UnauthorizedError('Usuário inválido')

    const tokens = await this.issueTokens(user.id, row.familyId)
    return { ...tokens, user: toUserPublic(user) }
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken, env.JWT_REFRESH_SECRET)
    const [row] = await db
      .select({ familyId: refreshTokens.familyId })
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, tokenHash))
      .limit(1)
    if (row) await this.revokeFamily(row.familyId)
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.familyId, familyId),
          isNull(refreshTokens.revokedAt),
        ),
      )
  }

  /**
   * Gera um token de reset. Retorna o token em claro apenas para o chamador
   * (envio por e-mail / log em dev) — nunca é exposto na resposta HTTP. Retorna
   * `null` quando o e-mail não existe, sem vazar essa informação.
   */
  async forgotPassword(email: string): Promise<string | null> {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .limit(1)
    if (!user) return null

    const token = generateOpaqueToken()
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: hashToken(token, env.JWT_REFRESH_SECRET),
      expiresAt: expiryFrom(env.RESET_TOKEN_TTL, Date.now()),
    })
    return token
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token, env.JWT_REFRESH_SECRET)
    const [row] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash))
      .limit(1)

    if (!row || row.usedAt || row.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestError('Token de redefinição inválido ou expirado')
    }

    const passwordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
    })
    await db.update(users).set({ passwordHash }).where(eq(users.id, row.userId))
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, row.id))

    // Invalida todas as sessões ativas do usuário após troca de senha.
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(refreshTokens.userId, row.userId),
          isNull(refreshTokens.revokedAt),
        ),
      )
  }
}

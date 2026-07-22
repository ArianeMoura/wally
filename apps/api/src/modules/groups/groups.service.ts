import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import type {
  AddMemberBody,
  CreateGroupBody,
  GroupMemberResponse,
  GroupResponse,
} from '@wally/contracts'
import { runAsUser, type Tx } from '../../db/rls'
import { groups, groupMembers } from '../../db/schema/groups'
import { users } from '../../db/schema/users'
import { ConflictError, ForbiddenError, NotFoundError } from '../../http/errors'

type GroupRow = typeof groups.$inferSelect
type MemberRow = typeof groupMembers.$inferSelect

function toGroupResponse(g: GroupRow): GroupResponse {
  return {
    id: g.id,
    name: g.name,
    ownerId: g.ownerId,
    version: g.version,
    createdAt: g.createdAt.toISOString(),
  }
}

function toMemberResponse(m: MemberRow): GroupMemberResponse {
  return {
    id: m.id,
    groupId: m.groupId,
    userId: m.userId,
    role: m.role,
    createdAt: m.createdAt.toISOString(),
  }
}

export function createGroup(
  userId: string,
  body: CreateGroupBody,
): Promise<GroupResponse> {
  return runAsUser(userId, async (tx) => {
    const [group] = await tx
      .insert(groups)
      .values({ name: body.name, ownerId: userId })
      .returning()
    await tx
      .insert(groupMembers)
      .values({ groupId: group!.id, userId, role: 'owner' })
    return toGroupResponse(group!)
  })
}

export function listGroups(userId: string): Promise<GroupResponse[]> {
  return runAsUser(userId, async (tx) => {
    const rows = await tx
      .select()
      .from(groups)
      .where(isNull(groups.deletedAt))
      .orderBy(desc(groups.createdAt))
    return rows.map(toGroupResponse)
  })
}

/** Loads a group visible to the user or throws 404; RLS hides the rest. */
async function requireVisibleGroup(tx: Tx, groupId: string): Promise<GroupRow> {
  const [group] = await tx
    .select()
    .from(groups)
    .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)))
    .limit(1)
  if (!group) throw new NotFoundError('Grupo não encontrado')
  return group
}

export function getGroup(
  userId: string,
  groupId: string,
): Promise<GroupResponse> {
  return runAsUser(userId, async (tx) => {
    const group = await requireVisibleGroup(tx, groupId)
    return toGroupResponse(group)
  })
}

export function listMembers(
  userId: string,
  groupId: string,
): Promise<GroupMemberResponse[]> {
  return runAsUser(userId, async (tx) => {
    await requireVisibleGroup(tx, groupId)
    const rows = await tx
      .select()
      .from(groupMembers)
      .where(
        and(eq(groupMembers.groupId, groupId), isNull(groupMembers.deletedAt)),
      )
    return rows.map(toMemberResponse)
  })
}

export function addMember(
  userId: string,
  groupId: string,
  body: AddMemberBody,
): Promise<GroupMemberResponse> {
  return runAsUser(userId, async (tx) => {
    const group = await requireVisibleGroup(tx, groupId)
    if (group.ownerId !== userId) {
      throw new ForbiddenError('Apenas o dono pode adicionar membros')
    }

    const [target] = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, body.userId), isNull(users.deletedAt)))
      .limit(1)
    if (!target) throw new NotFoundError('Usuário não encontrado')

    // Revive a soft-deleted membership, otherwise insert. unique(group,user)
    // prevents duplicates even across deleted rows.
    const [existing] = await tx
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, body.userId),
        ),
      )
      .limit(1)

    if (existing) {
      if (!existing.deletedAt) {
        throw new ConflictError('Usuário já é membro do grupo')
      }
      const [reactivated] = await tx
        .update(groupMembers)
        .set({ deletedAt: null, role: body.role })
        .where(eq(groupMembers.id, existing.id))
        .returning()
      return toMemberResponse(reactivated!)
    }

    const [member] = await tx
      .insert(groupMembers)
      .values({ groupId, userId: body.userId, role: body.role })
      .returning()
    return toMemberResponse(member!)
  })
}

export function removeMember(
  userId: string,
  groupId: string,
  memberUserId: string,
): Promise<void> {
  return runAsUser(userId, async (tx) => {
    // Serialize against expense creation through the advisory lock: FOR UPDATE on
    // `groups` would be blocked by RLS for members who are not the owner.
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${groupId})::bigint)`,
    )
    const [group] = await tx
      .select()
      .from(groups)
      .where(and(eq(groups.id, groupId), isNull(groups.deletedAt)))
      .limit(1)
    if (!group) throw new NotFoundError('Grupo não encontrado')

    const isOwner = group.ownerId === userId
    const isSelf = memberUserId === userId
    if (!isOwner && !isSelf) {
      throw new ForbiddenError('Sem permissão para remover este membro')
    }
    if (memberUserId === group.ownerId) {
      throw new ForbiddenError('O dono não pode ser removido do grupo')
    }

    const [removed] = await tx
      .update(groupMembers)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, memberUserId),
          isNull(groupMembers.deletedAt),
        ),
      )
      .returning({ id: groupMembers.id })
    if (!removed) throw new NotFoundError('Membro não encontrado')

    await tx.execute(sql`SELECT bump_group_version(${groupId})`)
  })
}

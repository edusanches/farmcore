import { type FarmRole } from "@/generated/prisma/client"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

const ROLE_HIERARCHY: Record<FarmRole, number> = {
  OWNER: 100,
  MANAGER: 80,
  ACCOUNTANT: 60,
  WORKER: 40,
  VIEWER: 20,
}

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  return session.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return user
}

export async function getUserFarms(userId: string) {
  return prisma.farmMembership.findMany({
    where: { userId, active: true },
    include: { farm: true },
    orderBy: { joinedAt: "asc" },
  })
}

export async function getUserActiveFarm(userId: string, farmId?: string) {
  if (farmId) {
    const membership = await prisma.farmMembership.findUnique({
      where: { userId_farmId: { userId, farmId } },
      include: { farm: true },
    })
    if (membership?.active) return membership
  }

  const memberships = await getUserFarms(userId)
  return memberships[0] ?? null
}

export async function requireFarmAccess(userId: string, farmId: string, minRole?: FarmRole) {
  const membership = await prisma.farmMembership.findUnique({
    where: { userId_farmId: { userId, farmId } },
  })

  if (!membership?.active) {
    throw new Error("Sem acesso a esta fazenda")
  }

  if (minRole && ROLE_HIERARCHY[membership.role] < ROLE_HIERARCHY[minRole]) {
    throw new Error("Permissao insuficiente")
  }

  return membership
}

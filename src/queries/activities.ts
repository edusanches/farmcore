import { prisma } from "@/lib/prisma"
import type { ActivityStatus, ActivityKind } from "@/generated/prisma/client"

export async function getActivities(
  farmId: string,
  filters?: {
    status?: ActivityStatus
    kind?: ActivityKind
    cropId?: string
    activityTypeId?: string
  }
) {
  return prisma.activity.findMany({
    where: {
      farmId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.kind && { kind: filters.kind }),
      ...(filters?.cropId && { cropId: filters.cropId }),
      ...(filters?.activityTypeId && { activityTypeId: filters.activityTypeId }),
    },
    include: {
      activityType: { select: { id: true, name: true, color: true, icon: true, subtypes: true } },
      crop: { select: { id: true, name: true } },
      activityAreas: {
        include: { area: { select: { id: true, name: true, sizeHa: true } } },
      },
      inputUsages: {
        include: { input: { select: { id: true, name: true, unit: true, category: true } } },
      },
      plannedActivity: {
        select: { id: true, code: true, kind: true },
      },
      realizations: {
        select: { id: true, code: true, status: true, startDate: true, totalHa: true },
      },
      stock: { select: { id: true, name: true } },
    },
    orderBy: { startDate: "desc" },
  })
}

export async function getCropActivities(
  farmId: string,
  cropId: string,
  filters?: {
    status?: ActivityStatus
    kind?: ActivityKind
    activityTypeId?: string
  }
) {
  return getActivities(farmId, { ...filters, cropId })
}

export async function getActivityById(farmId: string, activityId: string) {
  return prisma.activity.findFirst({
    where: { id: activityId, farmId },
    include: {
      activityType: true,
      crop: true,
      activityAreas: { include: { area: true } },
      inputUsages: { include: { input: true } },
      plannedActivity: {
        include: {
          activityAreas: { include: { area: { select: { id: true, name: true } } } },
          inputUsages: { include: { input: { select: { id: true, name: true, unit: true } } } },
        },
      },
      realizations: {
        include: {
          activityAreas: { include: { area: { select: { id: true, name: true } } } },
        },
        orderBy: { startDate: "desc" },
      },
      stock: true,
      logs: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })
}

export async function getActivityTypes(farmId: string) {
  return prisma.activityType.findMany({
    where: { farmId },
    orderBy: { name: "asc" },
  })
}

export async function getNextActivityCode(farmId: string) {
  const last = await prisma.activity.findFirst({
    where: { farmId },
    orderBy: { code: "desc" },
    select: { code: true },
  })
  if (!last) return "ATI-001"
  const num = parseInt(last.code.replace("ATI-", ""), 10)
  return `ATI-${String(num + 1).padStart(3, "0")}`
}

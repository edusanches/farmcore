"use server"

import { prisma } from "@/lib/prisma"
import { activitySchema } from "@/lib/validators"
import { requireAuth, requireFarmAccess } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import { getNextActivityCode } from "@/queries/activities"

export async function createActivity(farmId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = activitySchema.parse(data)
  const { areaIds, inputUsages, ...activityData } = parsed
  const code = await getNextActivityCode(farmId)

  const areas = await prisma.area.findMany({
    where: { id: { in: areaIds }, farmId },
    select: { id: true, sizeHa: true },
  })
  const totalHa = areas.reduce((sum, a) => sum + a.sizeHa, 0)

  const activity = await prisma.activity.create({
    data: {
      ...activityData,
      farmId,
      code,
      totalHa,
      activityAreas: {
        create: areaIds.map((areaId) => {
          const area = areas.find((a) => a.id === areaId)
          return { areaId, sizeHa: area?.sizeHa }
        }),
      },
    },
  })

  if (inputUsages?.length) {
    for (const usage of inputUsages) {
      await prisma.inputUsage.create({
        data: {
          activityId: activity.id,
          inputId: usage.inputId,
          quantity: usage.quantity,
          ratePerHa: usage.ratePerHa,
        },
      })
      await prisma.inventoryEntry.create({
        data: {
          farmId,
          inputId: usage.inputId,
          quantity: -usage.quantity,
          reason: "ACTIVITY_USAGE",
          referenceId: activity.id,
          referenceType: "ACTIVITY",
        },
      })
    }
  }

  await prisma.activityLog.create({
    data: {
      activityId: activity.id,
      userId: user.id,
      action: "CREATED",
      details: { code },
    },
  })

  revalidatePath("/atividades")
  return { success: true, activity }
}

export async function updateActivityStatus(
  farmId: string,
  activityId: string,
  status: "A_FAZER" | "EM_PROGRESSO" | "CONCLUIDO"
) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "WORKER")

  const activity = await prisma.activity.update({
    where: { id: activityId },
    data: { status },
  })

  await prisma.activityLog.create({
    data: {
      activityId,
      userId: user.id,
      action: "STATUS_CHANGED",
      details: { status },
    },
  })

  revalidatePath("/atividades")
  revalidatePath(`/atividades/${activityId}`)
  return { success: true, activity }
}

export async function deleteActivity(farmId: string, activityId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  // Reverse inventory entries
  const usages = await prisma.inputUsage.findMany({
    where: { activityId },
  })
  for (const usage of usages) {
    await prisma.inventoryEntry.create({
      data: {
        farmId,
        inputId: usage.inputId,
        quantity: usage.quantity,
        reason: "ACTIVITY_REVERSAL",
        referenceId: activityId,
        referenceType: "ACTIVITY",
      },
    })
  }

  await prisma.activity.delete({ where: { id: activityId } })

  revalidatePath("/atividades")
  return { success: true }
}

"use server"

import { prisma } from "@/lib/prisma"
import { cropSchema } from "@/lib/validators"
import { requireAuth, requireFarmAccess } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function createCrop(farmId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = cropSchema.parse(data)
  const { areaIds, ...cropData } = parsed

  const crop = await prisma.crop.create({
    data: {
      ...cropData,
      farmId,
      cropAreas: {
        create: areaIds.map((areaId) => ({ areaId })),
      },
    },
  })

  revalidatePath("/safras")
  return { success: true, crop }
}

export async function updateCrop(farmId: string, cropId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = cropSchema.parse(data)
  const { areaIds, ...cropData } = parsed

  await prisma.cropArea.deleteMany({ where: { cropId } })

  const crop = await prisma.crop.update({
    where: { id: cropId },
    data: {
      ...cropData,
      cropAreas: {
        create: areaIds.map((areaId) => ({ areaId })),
      },
    },
  })

  revalidatePath("/safras")
  revalidatePath(`/safras/${cropId}`)
  return { success: true, crop }
}

export async function deleteCrop(farmId: string, cropId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "OWNER")

  await prisma.crop.delete({ where: { id: cropId } })

  revalidatePath("/safras")
  return { success: true }
}

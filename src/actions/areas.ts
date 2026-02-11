"use server"

import { prisma } from "@/lib/prisma"
import { areaSchema } from "@/lib/validators"
import { requireAuth, requireFarmAccess } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function createArea(farmId: string, data: FormData) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = areaSchema.parse({
    name: data.get("name"),
    sizeHa: data.get("sizeHa"),
    geojson: data.get("geojson") ? JSON.parse(data.get("geojson") as string) : undefined,
    color: data.get("color") || undefined,
    description: data.get("description") || undefined,
  })

  const area = await prisma.area.create({
    data: { ...parsed, farmId },
  })

  revalidatePath("/areas")
  return { success: true, area }
}

export async function updateArea(farmId: string, areaId: string, data: FormData) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = areaSchema.parse({
    name: data.get("name"),
    sizeHa: data.get("sizeHa"),
    geojson: data.get("geojson") ? JSON.parse(data.get("geojson") as string) : undefined,
    color: data.get("color") || undefined,
    description: data.get("description") || undefined,
  })

  const area = await prisma.area.update({
    where: { id: areaId },
    data: parsed,
  })

  revalidatePath("/areas")
  revalidatePath(`/areas/${areaId}`)
  return { success: true, area }
}

export async function deleteArea(farmId: string, areaId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "OWNER")

  await prisma.area.update({
    where: { id: areaId },
    data: { active: false },
  })

  revalidatePath("/areas")
  return { success: true }
}

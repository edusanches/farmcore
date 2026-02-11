"use server"

import { prisma } from "@/lib/prisma"
import { inputSchema } from "@/lib/validators"
import { requireAuth, requireFarmAccess } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function createInput(farmId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = inputSchema.parse(data)

  const input = await prisma.input.create({
    data: { ...parsed, farmId },
  })

  revalidatePath("/insumos")
  return { success: true, input }
}

export async function updateInput(farmId: string, inputId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = inputSchema.parse(data)

  const input = await prisma.input.update({
    where: { id: inputId },
    data: parsed,
  })

  revalidatePath("/insumos")
  revalidatePath(`/insumos/${inputId}`)
  return { success: true, input }
}

export async function adjustInventory(
  farmId: string,
  inputId: string,
  quantity: number,
  reason: string,
  batch?: string
) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  await prisma.inventoryEntry.create({
    data: {
      farmId,
      inputId,
      quantity,
      reason,
      batch,
      referenceType: "MANUAL",
    },
  })

  revalidatePath("/insumos")
  revalidatePath(`/insumos/${inputId}`)
  return { success: true }
}

export async function deleteInput(farmId: string, inputId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "OWNER")

  await prisma.input.delete({ where: { id: inputId } })

  revalidatePath("/insumos")
  return { success: true }
}

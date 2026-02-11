"use server"

import { prisma } from "@/lib/prisma"
import { harvestSchema } from "@/lib/validators"
import { requireAuth, requireFarmAccess } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function createHarvest(farmId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = harvestSchema.parse(data)

  const area = await prisma.area.findFirst({
    where: { id: parsed.areaId, farmId },
    select: { sizeHa: true },
  })
  const yieldTonsHa = area ? parsed.totalTons / area.sizeHa : undefined

  const harvest = await prisma.harvest.create({
    data: {
      ...parsed,
      farmId,
      yieldTonsHa,
    },
  })

  // Create sale transaction if salePrice is provided
  if (parsed.salePrice && parsed.salePrice > 0) {
    const totalRevenue = parsed.totalTons * parsed.salePrice

    const incomeCat = await prisma.financialCategory.findFirst({
      where: { farmId, name: "Venda de Cana", type: "RECEITA" },
    })

    await prisma.transaction.create({
      data: {
        farmId,
        type: "RECEITA",
        description: `Venda colheita - ${parsed.buyerName || ""}`.trim(),
        amount: totalRevenue,
        dueDate: parsed.harvestDate,
        harvestId: harvest.id,
        categoryId: incomeCat?.id,
      },
    })
  }

  revalidatePath("/colheita")
  revalidatePath("/financeiro")
  return { success: true, harvest }
}

export async function deleteHarvest(farmId: string, harvestId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  await prisma.transaction.deleteMany({ where: { harvestId } })
  await prisma.harvest.delete({ where: { id: harvestId } })

  revalidatePath("/colheita")
  revalidatePath("/financeiro")
  return { success: true }
}

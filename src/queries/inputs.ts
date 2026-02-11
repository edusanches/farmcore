import { prisma } from "@/lib/prisma"
import type { InputCategory } from "@/generated/prisma/client"

export async function getInputs(farmId: string, category?: InputCategory) {
  const inputs = await prisma.input.findMany({
    where: {
      farmId,
      ...(category && { category }),
    },
    include: {
      inventoryEntries: { select: { quantity: true } },
      _count: { select: { inputUsages: true, purchaseItems: true } },
    },
    orderBy: { name: "asc" },
  })

  return inputs.map((input) => ({
    ...input,
    currentStock: input.inventoryEntries.reduce((sum, e) => sum + e.quantity, 0),
    inventoryEntries: undefined,
  }))
}

export async function getInputById(farmId: string, inputId: string) {
  const input = await prisma.input.findFirst({
    where: { id: inputId, farmId },
    include: {
      inventoryEntries: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      inputUsages: {
        include: {
          activity: {
            select: { id: true, code: true, startDate: true, status: true },
          },
        },
        take: 20,
      },
    },
  })

  if (!input) return null

  const currentStock = input.inventoryEntries.reduce((sum, e) => sum + e.quantity, 0)

  return { ...input, currentStock }
}

export async function getInputStock(farmId: string, inputId: string) {
  const result = await prisma.inventoryEntry.aggregate({
    where: { farmId, inputId },
    _sum: { quantity: true },
  })
  return result._sum.quantity ?? 0
}

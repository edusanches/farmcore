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

export async function getInputsByCrop(farmId: string, cropId: string) {
  const usages = await prisma.inputUsage.findMany({
    where: {
      activity: { farmId, cropId },
    },
    include: {
      input: {
        include: {
          inventoryEntries: { select: { quantity: true } },
        },
      },
    },
  })

  // Deduplicate inputs and aggregate usage quantities
  const inputMap = new Map<string, {
    id: string
    name: string
    category: string
    unit: string
    totalUsed: number
    currentStock: number
  }>()

  for (const usage of usages) {
    const existing = inputMap.get(usage.input.id)
    if (existing) {
      existing.totalUsed += usage.quantity
    } else {
      inputMap.set(usage.input.id, {
        id: usage.input.id,
        name: usage.input.name,
        category: usage.input.category,
        unit: usage.input.unit,
        totalUsed: usage.quantity,
        currentStock: usage.input.inventoryEntries.reduce((sum, e) => sum + e.quantity, 0),
      })
    }
  }

  return Array.from(inputMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export async function getInputsByCropAndArea(farmId: string, cropId: string, areaId: string) {
  const usages = await prisma.inputUsage.findMany({
    where: {
      activity: {
        farmId,
        cropId,
        activityAreas: { some: { areaId } },
      },
    },
    include: {
      input: {
        include: {
          inventoryEntries: { select: { quantity: true } },
        },
      },
    },
  })

  const inputMap = new Map<string, {
    id: string
    name: string
    category: string
    unit: string
    totalUsed: number
    currentStock: number
  }>()

  for (const usage of usages) {
    const existing = inputMap.get(usage.input.id)
    if (existing) {
      existing.totalUsed += usage.quantity
    } else {
      inputMap.set(usage.input.id, {
        id: usage.input.id,
        name: usage.input.name,
        category: usage.input.category,
        unit: usage.input.unit,
        totalUsed: usage.quantity,
        currentStock: usage.input.inventoryEntries.reduce((sum, e) => sum + e.quantity, 0),
      })
    }
  }

  return Array.from(inputMap.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export async function getInputStock(farmId: string, inputId: string) {
  const result = await prisma.inventoryEntry.aggregate({
    where: { farmId, inputId },
    _sum: { quantity: true },
  })
  return result._sum.quantity ?? 0
}

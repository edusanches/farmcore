import { prisma } from "@/lib/prisma"

export async function getHarvests(farmId: string, cropId?: string) {
  return prisma.harvest.findMany({
    where: { farmId, ...(cropId && { cropId }) },
    include: {
      crop: { select: { id: true, name: true } },
      area: { select: { id: true, name: true, sizeHa: true } },
      _count: { select: { transactions: true } },
    },
    orderBy: { harvestDate: "desc" },
  })
}

export async function getHarvestById(farmId: string, harvestId: string) {
  return prisma.harvest.findFirst({
    where: { id: harvestId, farmId },
    include: {
      crop: true,
      area: true,
      transactions: {
        include: { bankAccount: { select: { name: true } } },
      },
    },
  })
}

export async function getHarvestSummary(farmId: string, cropId?: string) {
  const harvests = await prisma.harvest.findMany({
    where: {
      farmId,
      ...(cropId && { cropId }),
    },
    include: {
      area: { select: { name: true, sizeHa: true } },
      crop: { select: { name: true } },
    },
  })

  const totalTons = harvests.reduce((sum, h) => sum + h.totalTons, 0)
  const totalHa = harvests.reduce((sum, h) => sum + (h.area.sizeHa ?? 0), 0)
  const avgTch = totalHa > 0 ? totalTons / totalHa : 0
  const avgAtr = harvests.length > 0
    ? harvests.reduce((sum, h) => sum + (h.atr ?? 0), 0) / harvests.filter((h) => h.atr).length
    : 0

  return { harvests, totalTons, totalHa, avgTch, avgAtr }
}

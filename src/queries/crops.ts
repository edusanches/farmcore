import { prisma } from "@/lib/prisma"

export async function getCrops(farmId: string) {
  return prisma.crop.findMany({
    where: { farmId },
    include: {
      cropAreas: {
        include: { area: { select: { id: true, name: true, sizeHa: true } } },
      },
      _count: {
        select: { activities: true, harvests: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getCropById(farmId: string, cropId: string) {
  return prisma.crop.findFirst({
    where: { id: cropId, farmId },
    include: {
      cropAreas: {
        include: { area: true },
      },
      activities: {
        include: {
          activityType: { select: { name: true, color: true } },
          activityAreas: { include: { area: { select: { name: true } } } },
        },
        orderBy: { startDate: "desc" },
      },
      harvests: {
        include: { area: { select: { name: true } } },
        orderBy: { harvestDate: "desc" },
      },
    },
  })
}

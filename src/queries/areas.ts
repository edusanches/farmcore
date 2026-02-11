import { prisma } from "@/lib/prisma"

export async function getAreas(farmId: string) {
  return prisma.area.findMany({
    where: { farmId, active: true },
    include: {
      cropAreas: {
        include: { crop: { select: { id: true, name: true, status: true } } },
      },
      _count: {
        select: { soilAnalyses: true, harvests: true, activityAreas: true },
      },
    },
    orderBy: { name: "asc" },
  })
}

export async function getAreaById(farmId: string, areaId: string) {
  return prisma.area.findFirst({
    where: { id: areaId, farmId },
    include: {
      cropAreas: {
        include: { crop: true },
      },
      soilAnalyses: {
        orderBy: { year: "desc" },
        take: 5,
      },
      activityAreas: {
        include: {
          activity: {
            include: {
              activityType: { select: { name: true, color: true } },
            },
          },
        },
        take: 10,
      },
      harvests: {
        orderBy: { harvestDate: "desc" },
        take: 5,
      },
    },
  })
}

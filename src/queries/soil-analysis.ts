import { prisma } from "@/lib/prisma"

export async function getSoilAnalyses(farmId: string, areaId?: string) {
  return prisma.soilAnalysis.findMany({
    where: {
      farmId,
      ...(areaId && { areaId }),
    },
    include: {
      area: { select: { id: true, name: true, sizeHa: true } },
    },
    orderBy: [{ year: "desc" }, { sampleDate: "desc" }],
  })
}

export async function getSoilAnalysisById(farmId: string, analysisId: string) {
  return prisma.soilAnalysis.findFirst({
    where: { id: analysisId, farmId },
    include: {
      area: true,
    },
  })
}

export async function getSoilAnalysisHistory(farmId: string, areaId: string) {
  const analyses = await prisma.soilAnalysis.findMany({
    where: { farmId, areaId },
    orderBy: { year: "asc" },
  })

  // Get fertilizer applications for correlation
  const fertilizerActivities = await prisma.activity.findMany({
    where: {
      farmId,
      activityAreas: { some: { areaId } },
      activityType: {
        name: { in: ["Aplicacao", "Fertilizacao"] },
      },
    },
    include: {
      activityType: { select: { name: true } },
      inputUsages: {
        include: {
          input: {
            select: { name: true, category: true },
          },
        },
      },
    },
    orderBy: { startDate: "asc" },
  })

  return { analyses, fertilizerActivities }
}

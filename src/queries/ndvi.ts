import { prisma } from "@/lib/prisma"

export async function getNdviReadings(areaId: string, limit = 60) {
  return prisma.ndviReading.findMany({
    where: {
      areaId,
      mean: { gte: 0.05 },
      OR: [
        { cloudCoverage: null },
        { cloudCoverage: { lte: 40 } },
      ],
    },
    orderBy: { date: "desc" },
    take: limit,
  })
}

export async function getLatestNdviByFarm(farmId: string) {
  const readings = await prisma.$queryRaw<
    Array<{
      areaId: string
      date: Date
      mean: number
      cloudCoverage: number | null
    }>
  >`
    SELECT DISTINCT ON (nr."areaId")
      nr."areaId",
      nr.date,
      nr.mean,
      nr."cloudCoverage"
    FROM ndvi_readings nr
    JOIN areas a ON a.id = nr."areaId"
    WHERE a."farmId" = ${farmId} AND a.active = true
      AND nr.mean >= 0.05
      AND (nr."cloudCoverage" IS NULL OR nr."cloudCoverage" <= 40)
    ORDER BY nr."areaId", nr.date DESC
  `

  return new Map(readings.map((r) => [r.areaId, r]))
}

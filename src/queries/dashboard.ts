import { prisma } from "@/lib/prisma"

export async function getDashboardData(farmId: string) {
  const [
    areasCount,
    totalArea,
    activeCrops,
    pendingActivities,
    recentActivities,
    pendingPayables,
    pendingReceivables,
  ] = await Promise.all([
    prisma.area.count({ where: { farmId, active: true } }),
    prisma.area.aggregate({
      where: { farmId, active: true },
      _sum: { sizeHa: true },
    }),
    prisma.crop.findMany({
      where: { farmId, status: { not: "FINALIZADA" } },
      include: {
        cropAreas: { include: { area: { select: { name: true, sizeHa: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.activity.count({
      where: { farmId, status: { not: "CONCLUIDO" } },
    }),
    prisma.activity.findMany({
      where: { farmId },
      include: {
        activityType: { select: { name: true, color: true } },
        activityAreas: { include: { area: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.transaction.aggregate({
      where: { farmId, type: "DESPESA", status: "PENDENTE" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.transaction.aggregate({
      where: { farmId, type: "RECEITA", status: "PENDENTE" },
      _sum: { amount: true },
      _count: true,
    }),
  ])

  return {
    areasCount,
    totalAreaHa: totalArea._sum.sizeHa ?? 0,
    activeCrops,
    pendingActivities,
    recentActivities,
    pendingPayables: {
      total: pendingPayables._sum.amount ?? 0,
      count: pendingPayables._count,
    },
    pendingReceivables: {
      total: pendingReceivables._sum.amount ?? 0,
      count: pendingReceivables._count,
    },
  }
}

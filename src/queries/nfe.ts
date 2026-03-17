import { prisma } from "@/lib/prisma"
import type { NfeImportStatus } from "@/generated/prisma/client"

export async function getNfeImports(farmId: string, status?: NfeImportStatus) {
  return prisma.nfeImport.findMany({
    where: {
      farmId,
      ...(status ? { status } : {}),
    },
    include: {
      items: true,
      supplier: { select: { id: true, name: true } },
    },
    orderBy: { dataEmissao: "desc" },
  })
}

export async function getNfeImportById(farmId: string, nfeImportId: string) {
  return prisma.nfeImport.findFirst({
    where: { id: nfeImportId, farmId },
    include: {
      items: true,
      supplier: true,
      transaction: { select: { id: true, description: true, amount: true, status: true } },
      purchase: { select: { id: true, code: true, status: true, totalAmount: true } },
    },
  })
}

export async function getNfeImportCounts(farmId: string) {
  const [pendente, aprovada, rejeitada] = await Promise.all([
    prisma.nfeImport.count({ where: { farmId, status: "PENDENTE" } }),
    prisma.nfeImport.count({ where: { farmId, status: "APROVADA" } }),
    prisma.nfeImport.count({ where: { farmId, status: "REJEITADA" } }),
  ])

  return { pendente, aprovada, rejeitada }
}

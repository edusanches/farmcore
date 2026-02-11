import { prisma } from "@/lib/prisma"

export async function getPurchases(farmId: string) {
  return prisma.purchase.findMany({
    where: { farmId },
    include: {
      supplier: { select: { name: true } },
      items: {
        include: { input: { select: { name: true } } },
      },
      _count: { select: { transactions: true } },
    },
    orderBy: { purchaseDate: "desc" },
  })
}

export async function getPurchaseById(farmId: string, purchaseId: string) {
  return prisma.purchase.findFirst({
    where: { id: purchaseId, farmId },
    include: {
      supplier: true,
      items: { include: { input: true } },
      transactions: {
        include: { bankAccount: { select: { name: true } } },
        orderBy: { installmentNumber: "asc" },
      },
    },
  })
}

export async function getSuppliers(farmId: string) {
  return prisma.supplier.findMany({
    where: { farmId },
    include: {
      _count: { select: { purchases: true } },
    },
    orderBy: { name: "asc" },
  })
}

export async function getNextPurchaseCode(farmId: string) {
  const last = await prisma.purchase.findFirst({
    where: { farmId },
    orderBy: { code: "desc" },
    select: { code: true },
  })
  if (!last) return "CMP-001"
  const num = parseInt(last.code.replace("CMP-", ""), 10)
  return `CMP-${String(num + 1).padStart(3, "0")}`
}

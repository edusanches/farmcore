import { prisma } from "@/lib/prisma"
import type { SupplierType } from "@/generated/prisma/client"

export async function getSuppliers(farmId: string, type?: SupplierType) {
  return prisma.supplier.findMany({
    where: {
      farmId,
      ...(type ? { types: { has: type } } : {}),
    },
    include: {
      contacts: { orderBy: { name: "asc" } },
      _count: {
        select: {
          purchases: true,
          transactions: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })
}

export async function getSupplierById(farmId: string, supplierId: string) {
  return prisma.supplier.findFirst({
    where: { id: supplierId, farmId },
    include: {
      purchases: {
        orderBy: { purchaseDate: "desc" },
        take: 5,
      },
      transactions: {
        orderBy: { dueDate: "desc" },
        take: 5,
      },
      _count: {
        select: {
          purchases: true,
          transactions: true,
        },
      },
    },
  })
}

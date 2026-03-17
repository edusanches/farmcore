import { prisma } from "@/lib/prisma"
import type { TransactionType, TransactionStatus } from "@/generated/prisma/client"

export async function getBankAccounts(farmId: string) {
  const accounts = await prisma.bankAccount.findMany({
    where: { farmId, active: true },
    include: {
      transactions: {
        where: { status: { in: ["PAGO", "RECEBIDO"] } },
        select: { amount: true, type: true, paymentDate: true },
      },
    },
    orderBy: { name: "asc" },
  })

  return accounts.map((account) => {
    const balance = account.transactions.reduce((sum, t) => {
      const txDate = t.paymentDate ?? new Date(0)
      if (txDate < account.initialBalanceDate) return sum
      return sum + (t.type === "RECEITA" ? t.amount : -t.amount)
    }, account.initialBalance)

    return { ...account, currentBalance: balance, transactions: undefined }
  })
}

export async function getTransactions(
  farmId: string,
  filters?: {
    type?: TransactionType
    status?: TransactionStatus
    bankAccountId?: string
    startDate?: Date
    endDate?: Date
  }
) {
  return prisma.transaction.findMany({
    where: {
      farmId,
      parentId: null,
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.bankAccountId && { bankAccountId: filters.bankAccountId }),
      ...(filters?.startDate && filters?.endDate && {
        dueDate: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      }),
    },
    include: {
      category: { select: { name: true, color: true } },
      bankAccount: { select: { name: true } },
      supplier: { select: { name: true } },
      installments: {
        orderBy: { installmentNumber: "asc" },
        select: { id: true, installmentNumber: true, amount: true, status: true, dueDate: true },
      },
    },
    orderBy: { dueDate: "desc" },
  })
}

export async function getTransactionById(farmId: string, transactionId: string) {
  return prisma.transaction.findFirst({
    where: { id: transactionId, farmId },
    include: {
      category: { select: { id: true, name: true, color: true } },
      bankAccount: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
      installments: {
        orderBy: { installmentNumber: "asc" },
        select: { id: true, installmentNumber: true, amount: true, status: true, dueDate: true },
      },
    },
  })
}

export async function getFinancialCategories(farmId: string, type?: TransactionType) {
  return prisma.financialCategory.findMany({
    where: {
      farmId,
      ...(type && { type }),
    },
    include: {
      children: true,
      _count: { select: { transactions: true } },
    },
    orderBy: { name: "asc" },
  })
}

export async function getCashFlow(farmId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const transactions = await prisma.transaction.findMany({
    where: {
      farmId,
      dueDate: { gte: startDate, lte: endDate },
      status: { not: "CANCELADO" },
    },
    include: {
      category: { select: { name: true } },
    },
    orderBy: { dueDate: "asc" },
  })

  const income = transactions
    .filter((t) => t.type === "RECEITA")
    .reduce((sum, t) => sum + t.amount, 0)
  const expenses = transactions
    .filter((t) => t.type === "DESPESA")
    .reduce((sum, t) => sum + t.amount, 0)

  return { transactions, income, expenses, balance: income - expenses }
}

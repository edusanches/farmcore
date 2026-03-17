import { prisma } from "@/lib/prisma"
import type { InputCategory, ActivityKind } from "@/generated/prisma/client"

// Aegro-style cost categories
const COST_CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  SEMENTE: { label: "Sementes", color: "#22c55e" },
  FERTILIZANTE: { label: "Fertilizantes", color: "#ef4444" },
  DEFENSIVOS: { label: "Defensivos", color: "#3b82f6" },
  COMBUSTIVEL: { label: "Combustivel", color: "#f59e0b" },
  OUTROS_INSUMOS: { label: "Outros insumos", color: "#ec4899" },
  OUTROS_CUSTOS: { label: "Outros custos", color: "#a855f7" },
}

const DEFENSIVO_CATEGORIES: InputCategory[] = [
  "HERBICIDA",
  "INSETICIDA",
  "FUNGICIDA",
  "ADJUVANTE",
]

export interface CostItem {
  inputId: string
  name: string
  subcategory?: string
  quantity: number
  unit: string
  avgUnitPrice: number
  totalCost: number
  percentage: number
}

export interface CostCategory {
  key: string
  label: string
  color: string
  totalCost: number
  percentage: number
  items: CostItem[]
}

export interface CropCostsResult {
  categories: CostCategory[]
  totalCost: number
}

export async function getCropCosts(
  farmId: string,
  cropId: string,
  areaId?: string,
  kind?: ActivityKind
) {
  // 1. Get all input usages for the crop (optionally filtered by area and kind)
  const areaFilter = areaId
    ? { activityAreas: { some: { areaId } } }
    : {}
  const kindFilter = kind ? { kind } : {}

  const usages = await prisma.inputUsage.findMany({
    where: {
      activity: {
        farmId,
        cropId,
        ...areaFilter,
        ...kindFilter,
      },
    },
    include: {
      input: {
        include: {
          purchaseItems: {
            where: {
              purchase: {
                farmId,
                status: { in: ["CONFIRMADA", "RECEBIDA"] },
              },
            },
            select: { unitPrice: true, quantity: true },
          },
          inventoryEntries: {
            where: { farmId, unitCost: { not: null } },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { unitCost: true },
          },
        },
      },
    },
  })

  // 2. Get activity overhead costs
  const activities = await prisma.activity.findMany({
    where: {
      farmId,
      cropId,
      costOverride: { not: null },
      ...areaFilter,
      ...kindFilter,
    },
    select: {
      id: true,
      code: true,
      costOverride: true,
      activityType: { select: { name: true } },
    },
  })

  // 3. Aggregate input usages by input, then group by Aegro category
  const inputAgg = new Map<
    string,
    {
      inputId: string
      name: string
      category: InputCategory
      unit: string
      totalQuantity: number
      avgUnitPrice: number
    }
  >()

  for (const usage of usages) {
    const input = usage.input
    const existing = inputAgg.get(input.id)
    if (existing) {
      existing.totalQuantity += usage.quantity
    } else {
      // Calculate weighted average unit price from purchases
      let avgPrice = 0
      if (input.purchaseItems.length > 0) {
        const totalCost = input.purchaseItems.reduce(
          (sum, pi) => sum + pi.unitPrice * pi.quantity,
          0
        )
        const totalQty = input.purchaseItems.reduce(
          (sum, pi) => sum + pi.quantity,
          0
        )
        avgPrice = totalQty > 0 ? totalCost / totalQty : 0
      } else if (
        input.inventoryEntries.length > 0 &&
        input.inventoryEntries[0].unitCost != null
      ) {
        avgPrice = input.inventoryEntries[0].unitCost
      }

      inputAgg.set(input.id, {
        inputId: input.id,
        name: input.name,
        category: input.category,
        unit: input.unit,
        totalQuantity: usage.quantity,
        avgUnitPrice: avgPrice,
      })
    }
  }

  // 4. Group into Aegro-style categories
  const categoryMap = new Map<string, CostCategory>()

  for (const input of inputAgg.values()) {
    const cost = input.totalQuantity * input.avgUnitPrice

    let catKey: string
    let subcategory: string | undefined

    if (input.category === "SEMENTE") {
      catKey = "SEMENTE"
    } else if (input.category === "FERTILIZANTE") {
      catKey = "FERTILIZANTE"
    } else if (DEFENSIVO_CATEGORIES.includes(input.category)) {
      catKey = "DEFENSIVOS"
      // Sub-group label
      const subLabels: Record<string, string> = {
        HERBICIDA: "Herbicida",
        INSETICIDA: "Inseticida",
        FUNGICIDA: "Fungicida",
        ADJUVANTE: "Adjuvante",
      }
      subcategory = subLabels[input.category] ?? input.category
    } else if (input.category === "COMBUSTIVEL") {
      catKey = "COMBUSTIVEL"
    } else {
      catKey = "OUTROS_INSUMOS"
    }

    const catMeta = COST_CATEGORY_MAP[catKey]!
    if (!categoryMap.has(catKey)) {
      categoryMap.set(catKey, {
        key: catKey,
        label: catMeta.label,
        color: catMeta.color,
        totalCost: 0,
        percentage: 0,
        items: [],
      })
    }

    const cat = categoryMap.get(catKey)!
    cat.totalCost += cost
    cat.items.push({
      inputId: input.inputId,
      name: input.name,
      subcategory,
      quantity: input.totalQuantity,
      unit: input.unit,
      avgUnitPrice: input.avgUnitPrice,
      totalCost: cost,
      percentage: 0,
    })
  }

  // 5. Add activity overhead as "Outros custos"
  const overheadTotal = activities.reduce(
    (sum, a) => sum + (a.costOverride ?? 0),
    0
  )

  if (overheadTotal > 0 || activities.length > 0) {
    const catMeta = COST_CATEGORY_MAP.OUTROS_CUSTOS!
    if (!categoryMap.has("OUTROS_CUSTOS")) {
      categoryMap.set("OUTROS_CUSTOS", {
        key: "OUTROS_CUSTOS",
        label: catMeta.label,
        color: catMeta.color,
        totalCost: 0,
        percentage: 0,
        items: [],
      })
    }

    const cat = categoryMap.get("OUTROS_CUSTOS")!
    for (const activity of activities) {
      const actCost = activity.costOverride ?? 0
      cat.totalCost += actCost
      cat.items.push({
        inputId: activity.id,
        name: `${activity.activityType.name} (${activity.code})`,
        quantity: 0,
        unit: "",
        avgUnitPrice: 0,
        totalCost: actCost,
        percentage: 0,
      })
    }
  }

  // 6. Calculate totals and percentages
  const categories = Array.from(categoryMap.values())
  const totalCost = categories.reduce((sum, c) => sum + c.totalCost, 0)

  for (const cat of categories) {
    cat.percentage = totalCost > 0 ? (cat.totalCost / totalCost) * 100 : 0
    for (const item of cat.items) {
      item.percentage = totalCost > 0 ? (item.totalCost / totalCost) * 100 : 0
    }
    // Sort items by totalCost desc
    cat.items.sort((a, b) => b.totalCost - a.totalCost)
  }

  // Sort categories by the defined order
  const ORDER = [
    "SEMENTE",
    "FERTILIZANTE",
    "DEFENSIVOS",
    "COMBUSTIVEL",
    "OUTROS_INSUMOS",
    "OUTROS_CUSTOS",
  ]
  categories.sort(
    (a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key)
  )

  return { categories, totalCost }
}

import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import bcrypt from "bcryptjs"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding database...")

  // ============================================================
  // USER + FARM + MEMBERSHIP
  // ============================================================

  const passwordHash = await bcrypt.hash("admin123", 12)
  const user = await prisma.user.upsert({
    where: { email: "admin@farmcore.app" },
    update: {},
    create: {
      name: "Eduardo",
      email: "admin@farmcore.app",
      passwordHash,
    },
  })

  const farm = await prisma.farm.upsert({
    where: { id: "fazenda-sp" },
    update: {},
    create: {
      id: "fazenda-sp",
      name: "Fazenda Sao Paulo",
      city: "Ribeirao Preto",
      state: "SP",
      totalArea: 78.82,
    },
  })

  await prisma.farmMembership.upsert({
    where: { userId_farmId: { userId: user.id, farmId: farm.id } },
    update: {},
    create: {
      userId: user.id,
      farmId: farm.id,
      role: "OWNER",
    },
  })

  const farmId = farm.id

  // ============================================================
  // ACTIVITY TYPES
  // ============================================================

  const activityTypeData = [
    { name: "Aplicacao", subtypes: ["Herbicida", "Inseticida", "Fungicida", "Fertilizante", "Corte de soqueira"], icon: "spray-can", color: "#22c55e" },
    { name: "Fertilizacao", subtypes: ["Fertilizacao de Cobertura", "Fertilizacao de Plantio", "Calagem", "Gessagem"], icon: "flask-conical", color: "#3b82f6" },
    { name: "Colheita", subtypes: ["Colheita Mecanizada", "Colheita Manual"], icon: "truck", color: "#f59e0b" },
    { name: "Preparo de Solo", subtypes: ["Aracao", "Gradagem", "Subsolagem", "Sulcacao"], icon: "tractor", color: "#8b5cf6" },
    { name: "Plantio", subtypes: ["Plantio Mecanizado", "Plantio Manual"], icon: "sprout", color: "#10b981" },
    { name: "Outro", subtypes: ["Catacao", "Carpa", "Manutencao"], icon: "more-horizontal", color: "#6b7280" },
  ]

  const activityTypes: Record<string, string> = {}
  for (const at of activityTypeData) {
    const created = await prisma.activityType.upsert({
      where: { farmId_name: { farmId, name: at.name } },
      update: {},
      create: { farmId, ...at },
    })
    activityTypes[at.name] = created.id
  }

  // ============================================================
  // FINANCIAL CATEGORIES
  // ============================================================

  const expenseCategories = [
    "Defensivos", "Fertilizantes", "Combustivel", "Mao de Obra",
    "Servicos Mecanizados", "Sementes e Mudas", "Financiamento",
    "Impostos e Taxas", "Manutencao", "Outros Custos",
  ]
  const catIds: Record<string, string> = {}
  for (const name of expenseCategories) {
    const cat = await prisma.financialCategory.upsert({
      where: { farmId_name_type: { farmId, name, type: "DESPESA" } },
      update: {},
      create: { farmId, name, type: "DESPESA" },
    })
    catIds[name] = cat.id
  }

  const incomeCategories = [
    "Venda de Cana", "Venda de Subprodutos", "Arrendamento",
    "Financiamento Recebido", "Outras Receitas",
  ]
  for (const name of incomeCategories) {
    const cat = await prisma.financialCategory.upsert({
      where: { farmId_name_type: { farmId, name, type: "RECEITA" } },
      update: {},
      create: { farmId, name, type: "RECEITA" },
    })
    catIds[name] = cat.id
  }

  // ============================================================
  // AREAS (TALHOES)
  // ============================================================

  const areasData = [
    { name: "Talhao 1", sizeHa: 12.68 },
    { name: "Talhao 2", sizeHa: 8.01 },
    { name: "Talhao 3", sizeHa: 9.52 },
    { name: "Talhao 4", sizeHa: 6.41 },
    { name: "Talhao 5", sizeHa: 16.30 },
    { name: "Talhao 6", sizeHa: 2.73 },
    { name: "Talhao 7", sizeHa: 8.18 },
    { name: "Talhao 8", sizeHa: 8.79 },
  ]

  const areaIds: Record<string, string> = {}
  for (const area of areasData) {
    const created = await prisma.area.upsert({
      where: { farmId_name: { farmId, name: area.name } },
      update: {},
      create: { farmId, ...area },
    })
    areaIds[area.name] = created.id
  }

  // ============================================================
  // CROPS (SAFRAS)
  // ============================================================

  const crop2425 = await prisma.crop.create({
    data: {
      farmId,
      name: "Cana 24/25 (Soqueira)",
      plantingType: "SOQUEIRA",
      variety: "RB966928",
      startDate: new Date("2024-04-01"),
      endDate: new Date("2025-03-31"),
      status: "FINALIZADA",
      notes: "Safra finalizada com boa produtividade",
    },
  })

  const crop2526 = await prisma.crop.create({
    data: {
      farmId,
      name: "Cana 25/26 (Soqueira)",
      plantingType: "SOQUEIRA",
      variety: "RB966928",
      startDate: new Date("2025-04-01"),
      status: "EM_ANDAMENTO",
      notes: "Safra atual em andamento",
    },
  })

  // Link crops to areas
  const allAreaNames = Object.keys(areaIds)
  for (const areaName of allAreaNames) {
    await prisma.cropArea.create({
      data: { cropId: crop2425.id, areaId: areaIds[areaName] },
    })
    await prisma.cropArea.create({
      data: { cropId: crop2526.id, areaId: areaIds[areaName] },
    })
  }

  // ============================================================
  // INPUTS (INSUMOS)
  // ============================================================

  const inputsData = [
    { name: "Glifosato 480 SL", category: "HERBICIDA" as const, unit: "L" as const, manufacturer: "Nortox", activeAgent: "Glifosato" },
    { name: "Diuron 500 SC", category: "HERBICIDA" as const, unit: "L" as const, manufacturer: "Nortox", activeAgent: "Diuron" },
    { name: "Fipronil 800 WG", category: "INSETICIDA" as const, unit: "KG" as const, manufacturer: "BASF", activeAgent: "Fipronil" },
    { name: "MAP Purificado", category: "FERTILIZANTE" as const, unit: "KG" as const, manufacturer: "Mosaic", activeAgent: "Fosforo + Nitrogenio" },
    { name: "KCl (Cloreto de Potassio)", category: "FERTILIZANTE" as const, unit: "KG" as const, manufacturer: "ICL", activeAgent: "Potassio" },
    { name: "Calcario Dolomitico", category: "FERTILIZANTE" as const, unit: "T" as const, manufacturer: "Votorantim", activeAgent: "CaO + MgO" },
    { name: "Ureia 46%", category: "FERTILIZANTE" as const, unit: "KG" as const, manufacturer: "Petrobras", activeAgent: "Nitrogenio" },
    { name: "Oleo Diesel S10", category: "COMBUSTIVEL" as const, unit: "L" as const, manufacturer: "Petrobras" },
  ]

  const inputIds: Record<string, string> = {}
  for (const input of inputsData) {
    const created = await prisma.input.upsert({
      where: { farmId_name: { farmId, name: input.name } },
      update: {},
      create: { farmId, ...input, minStock: input.category === "COMBUSTIVEL" ? 500 : 100 },
    })
    inputIds[input.name] = created.id
  }

  // Inventory entries (initial stock)
  const stockEntries = [
    { inputName: "Glifosato 480 SL", qty: 200, cost: 28.50 },
    { inputName: "Diuron 500 SC", qty: 100, cost: 42.00 },
    { inputName: "Fipronil 800 WG", qty: 50, cost: 180.00 },
    { inputName: "MAP Purificado", qty: 3000, cost: 4.20 },
    { inputName: "KCl (Cloreto de Potassio)", qty: 2000, cost: 3.80 },
    { inputName: "Calcario Dolomitico", qty: 80, cost: 120.00 },
    { inputName: "Ureia 46%", qty: 1500, cost: 3.50 },
    { inputName: "Oleo Diesel S10", qty: 2000, cost: 6.20 },
  ]

  for (const entry of stockEntries) {
    await prisma.inventoryEntry.create({
      data: {
        farmId,
        inputId: inputIds[entry.inputName],
        quantity: entry.qty,
        reason: "INITIAL_STOCK",
        unitCost: entry.cost,
        batch: "SEED",
      },
    })
  }

  // ============================================================
  // ACTIVITIES
  // ============================================================

  // 1. Herbicide application on Talhao 1 and 2
  const act1 = await prisma.activity.create({
    data: {
      farmId,
      code: "ATI-001",
      activityTypeId: activityTypes["Aplicacao"],
      subtype: "Herbicida",
      cropId: crop2526.id,
      team: "Equipe A",
      startDate: new Date("2025-05-15"),
      endDate: new Date("2025-05-15"),
      status: "CONCLUIDO",
      totalHa: 20.69,
      notes: "Aplicacao de glifosato pre-emergente",
      activityAreas: {
        create: [
          { areaId: areaIds["Talhao 1"], sizeHa: 12.68 },
          { areaId: areaIds["Talhao 2"], sizeHa: 8.01 },
        ],
      },
    },
  })

  await prisma.inputUsage.create({
    data: { activityId: act1.id, inputId: inputIds["Glifosato 480 SL"], quantity: 62.07, ratePerHa: 3.0 },
  })
  await prisma.inventoryEntry.create({
    data: { farmId, inputId: inputIds["Glifosato 480 SL"], quantity: -62.07, reason: "ACTIVITY_USAGE", referenceId: act1.id, referenceType: "ACTIVITY" },
  })

  // 2. Fertilization on Talhao 5
  const act2 = await prisma.activity.create({
    data: {
      farmId,
      code: "ATI-002",
      activityTypeId: activityTypes["Fertilizacao"],
      subtype: "Fertilizacao de Cobertura",
      cropId: crop2526.id,
      team: "Equipe B",
      startDate: new Date("2025-06-10"),
      endDate: new Date("2025-06-11"),
      status: "CONCLUIDO",
      totalHa: 16.30,
      notes: "Aplicacao de KCl e Ureia em cobertura",
      activityAreas: {
        create: [
          { areaId: areaIds["Talhao 5"], sizeHa: 16.30 },
        ],
      },
    },
  })

  await prisma.inputUsage.create({
    data: { activityId: act2.id, inputId: inputIds["KCl (Cloreto de Potassio)"], quantity: 489, ratePerHa: 30.0 },
  })
  await prisma.inventoryEntry.create({
    data: { farmId, inputId: inputIds["KCl (Cloreto de Potassio)"], quantity: -489, reason: "ACTIVITY_USAGE", referenceId: act2.id, referenceType: "ACTIVITY" },
  })
  await prisma.inputUsage.create({
    data: { activityId: act2.id, inputId: inputIds["Ureia 46%"], quantity: 326, ratePerHa: 20.0 },
  })
  await prisma.inventoryEntry.create({
    data: { farmId, inputId: inputIds["Ureia 46%"], quantity: -326, reason: "ACTIVITY_USAGE", referenceId: act2.id, referenceType: "ACTIVITY" },
  })

  // 3. Planned activity (insecticide application)
  await prisma.activity.create({
    data: {
      farmId,
      code: "ATI-003",
      activityTypeId: activityTypes["Aplicacao"],
      subtype: "Inseticida",
      cropId: crop2526.id,
      team: "Equipe A",
      startDate: new Date("2025-07-20"),
      status: "A_FAZER",
      totalHa: 35.49,
      notes: "Controle de broca da cana - aplicacao de Fipronil",
      activityAreas: {
        create: [
          { areaId: areaIds["Talhao 3"], sizeHa: 9.52 },
          { areaId: areaIds["Talhao 5"], sizeHa: 16.30 },
          { areaId: areaIds["Talhao 7"], sizeHa: 8.18 },
          { areaId: areaIds["Talhao 8"], sizeHa: 8.79 },
        ],
      },
    },
  })

  // 4. In-progress activity (liming)
  await prisma.activity.create({
    data: {
      farmId,
      code: "ATI-004",
      activityTypeId: activityTypes["Fertilizacao"],
      subtype: "Calagem",
      cropId: crop2526.id,
      team: "Equipe B",
      startDate: new Date("2025-07-01"),
      status: "EM_PROGRESSO",
      totalHa: 19.14,
      notes: "Calagem em areas com V% abaixo de 60%",
      activityAreas: {
        create: [
          { areaId: areaIds["Talhao 4"], sizeHa: 6.41 },
          { areaId: areaIds["Talhao 6"], sizeHa: 2.73 },
        ],
      },
    },
  })

  // Activity logs
  for (const code of ["ATI-001", "ATI-002", "ATI-003", "ATI-004"]) {
    const activity = await prisma.activity.findFirst({ where: { farmId, code } })
    if (activity) {
      await prisma.activityLog.create({
        data: { activityId: activity.id, userId: user.id, action: "CREATED", details: { code } },
      })
    }
  }

  // ============================================================
  // SOIL ANALYSES
  // ============================================================

  // Talhao 1 - 3 years of data
  await prisma.soilAnalysis.create({
    data: {
      farmId, areaId: areaIds["Talhao 1"], sampleDate: new Date("2023-03-15"), year: 2023,
      labName: "Laboratorio Agrosolo", depth: "0-20",
      pH: 5.1, organicMatter: 28, phosphorus: 12, potassium: 1.8,
      calcium: 22, magnesium: 8, aluminum: 2, hPlusAl: 38,
      sumOfBases: 31.8, ctc: 69.8, baseSaturation: 45.6, aluminumSaturation: 5.9,
      sulfur: 8, boron: 0.3, copper: 1.2, iron: 45, manganese: 12, zinc: 1.1,
      clayPercent: 42, siltPercent: 18, sandPercent: 40, textureClass: "Argilosa",
    },
  })

  await prisma.soilAnalysis.create({
    data: {
      farmId, areaId: areaIds["Talhao 1"], sampleDate: new Date("2024-03-20"), year: 2024,
      labName: "Laboratorio Agrosolo", depth: "0-20",
      pH: 5.4, organicMatter: 30, phosphorus: 18, potassium: 2.2,
      calcium: 28, magnesium: 10, aluminum: 1, hPlusAl: 31,
      sumOfBases: 40.2, ctc: 71.2, baseSaturation: 56.5, aluminumSaturation: 2.4,
      sulfur: 10, boron: 0.4, copper: 1.4, iron: 42, manganese: 14, zinc: 1.5,
      clayPercent: 42, siltPercent: 18, sandPercent: 40, textureClass: "Argilosa",
    },
  })

  await prisma.soilAnalysis.create({
    data: {
      farmId, areaId: areaIds["Talhao 1"], sampleDate: new Date("2025-03-18"), year: 2025,
      labName: "Laboratorio Agrosolo", depth: "0-20",
      pH: 5.7, organicMatter: 32, phosphorus: 22, potassium: 2.8,
      calcium: 35, magnesium: 12, aluminum: 0, hPlusAl: 25,
      sumOfBases: 49.8, ctc: 74.8, baseSaturation: 66.6, aluminumSaturation: 0,
      sulfur: 12, boron: 0.5, copper: 1.6, iron: 40, manganese: 16, zinc: 1.8,
      clayPercent: 42, siltPercent: 18, sandPercent: 40, textureClass: "Argilosa",
      notes: "Melhora significativa apos calagem e fertilizacao de 2024",
    },
  })

  // Talhao 5 - 2 years of data
  await prisma.soilAnalysis.create({
    data: {
      farmId, areaId: areaIds["Talhao 5"], sampleDate: new Date("2024-04-10"), year: 2024,
      labName: "Laboratorio Agrosolo", depth: "0-20",
      pH: 4.8, organicMatter: 22, phosphorus: 8, potassium: 1.2,
      calcium: 15, magnesium: 5, aluminum: 4, hPlusAl: 48,
      sumOfBases: 21.2, ctc: 69.2, baseSaturation: 30.6, aluminumSaturation: 15.9,
      sulfur: 6, boron: 0.2, copper: 0.8, iron: 55, manganese: 8, zinc: 0.6,
      clayPercent: 35, siltPercent: 20, sandPercent: 45, textureClass: "Media",
    },
  })

  await prisma.soilAnalysis.create({
    data: {
      farmId, areaId: areaIds["Talhao 5"], sampleDate: new Date("2025-04-08"), year: 2025,
      labName: "Laboratorio Agrosolo", depth: "0-20",
      pH: 5.2, organicMatter: 25, phosphorus: 15, potassium: 1.9,
      calcium: 22, magnesium: 8, aluminum: 1, hPlusAl: 35,
      sumOfBases: 31.9, ctc: 66.9, baseSaturation: 47.7, aluminumSaturation: 3.0,
      sulfur: 9, boron: 0.3, copper: 1.0, iron: 48, manganese: 11, zinc: 1.0,
      clayPercent: 35, siltPercent: 20, sandPercent: 45, textureClass: "Media",
      notes: "Boa resposta a calagem aplicada em 2024",
    },
  })

  // ============================================================
  // SUPPLIERS
  // ============================================================

  const supplier1 = await prisma.supplier.upsert({
    where: { farmId_name: { farmId, name: "Agroshop Ribeirao" } },
    update: {},
    create: {
      farmId, name: "Agroshop Ribeirao",
      document: "12.345.678/0001-90",
      phone: "(16) 3610-1234",
      email: "vendas@agroshop.com.br",
      address: "Av. Brasil, 1200 - Ribeirao Preto/SP",
    },
  })

  const supplier2 = await prisma.supplier.upsert({
    where: { farmId_name: { farmId, name: "Usina Santa Rita" } },
    update: {},
    create: {
      farmId, name: "Usina Santa Rita",
      document: "98.765.432/0001-10",
      phone: "(16) 3620-5678",
      email: "compras@santarita.com.br",
      address: "Rod. SP-322 km 45 - Santa Rita do Passa Quatro/SP",
    },
  })

  // ============================================================
  // BANK ACCOUNTS
  // ============================================================

  const bankAccount = await prisma.bankAccount.create({
    data: {
      farmId,
      name: "Conta Principal",
      bankName: "Banco do Brasil",
      agency: "3456-7",
      accountNumber: "12345-6",
      initialBalance: 85000,
    },
  })

  // ============================================================
  // PURCHASES
  // ============================================================

  const purchase1 = await prisma.purchase.create({
    data: {
      farmId,
      code: "CMP-001",
      supplierId: supplier1.id,
      status: "RECEBIDA",
      purchaseDate: new Date("2025-04-20"),
      deliveryDate: new Date("2025-04-25"),
      invoiceNumber: "NF-4521",
      totalAmount: 15600,
      notes: "Compra de defensivos para safra 25/26",
      items: {
        create: [
          { inputId: inputIds["Glifosato 480 SL"], description: "Glifosato 480 SL - 200L", quantity: 200, unit: "L", unitPrice: 28.50, totalPrice: 5700 },
          { inputId: inputIds["Diuron 500 SC"], description: "Diuron 500 SC - 100L", quantity: 100, unit: "L", unitPrice: 42.00, totalPrice: 4200 },
          { inputId: inputIds["Fipronil 800 WG"], description: "Fipronil 800 WG - 50kg", quantity: 50, unit: "KG", unitPrice: 114.00, totalPrice: 5700 },
        ],
      },
    },
  })

  // Transaction for the purchase
  await prisma.transaction.create({
    data: {
      farmId,
      type: "DESPESA",
      status: "PAGO",
      categoryId: catIds["Defensivos"],
      bankAccountId: bankAccount.id,
      description: "Pagamento CMP-001 - Agroshop Ribeirao",
      amount: 15600,
      dueDate: new Date("2025-05-20"),
      paymentDate: new Date("2025-05-18"),
      supplierId: supplier1.id,
      purchaseId: purchase1.id,
    },
  })

  // ============================================================
  // HARVESTS
  // ============================================================

  // Harvest from previous crop season (24/25)
  const harvest1 = await prisma.harvest.create({
    data: {
      farmId,
      cropId: crop2425.id,
      areaId: areaIds["Talhao 1"],
      harvestDate: new Date("2025-01-15"),
      totalTons: 1141.2,
      yieldTonsHa: 90.0,
      tch: 90.0,
      atr: 148.5,
      brix: 21.2,
      pol: 18.8,
      fiber: 12.5,
      purity: 88.7,
      salePrice: 155.00,
      buyerName: "Usina Santa Rita",
      ticketNumber: "TKT-2025-0142",
      notes: "Boa qualidade, ATR acima da media",
    },
  })

  const harvest2 = await prisma.harvest.create({
    data: {
      farmId,
      cropId: crop2425.id,
      areaId: areaIds["Talhao 5"],
      harvestDate: new Date("2025-02-10"),
      totalTons: 1304.0,
      yieldTonsHa: 80.0,
      tch: 80.0,
      atr: 142.3,
      brix: 20.5,
      pol: 17.9,
      fiber: 13.1,
      purity: 87.3,
      salePrice: 148.00,
      buyerName: "Usina Santa Rita",
      ticketNumber: "TKT-2025-0198",
    },
  })

  const harvest3 = await prisma.harvest.create({
    data: {
      farmId,
      cropId: crop2425.id,
      areaId: areaIds["Talhao 2"],
      harvestDate: new Date("2025-02-28"),
      totalTons: 680.85,
      yieldTonsHa: 85.0,
      tch: 85.0,
      atr: 145.0,
      brix: 20.8,
      pol: 18.2,
      fiber: 12.8,
      purity: 87.5,
      salePrice: 152.00,
      buyerName: "Usina Santa Rita",
      ticketNumber: "TKT-2025-0235",
    },
  })

  // Revenue transactions from harvests
  await prisma.transaction.create({
    data: {
      farmId,
      type: "RECEITA",
      status: "RECEBIDO",
      categoryId: catIds["Venda de Cana"],
      bankAccountId: bankAccount.id,
      description: "Venda colheita Talhao 1 - Usina Santa Rita",
      amount: 176886.00,
      dueDate: new Date("2025-02-15"),
      paymentDate: new Date("2025-02-15"),
      harvestId: harvest1.id,
    },
  })

  await prisma.transaction.create({
    data: {
      farmId,
      type: "RECEITA",
      status: "RECEBIDO",
      categoryId: catIds["Venda de Cana"],
      bankAccountId: bankAccount.id,
      description: "Venda colheita Talhao 5 - Usina Santa Rita",
      amount: 192992.00,
      dueDate: new Date("2025-03-10"),
      paymentDate: new Date("2025-03-12"),
      harvestId: harvest2.id,
    },
  })

  await prisma.transaction.create({
    data: {
      farmId,
      type: "RECEITA",
      status: "PENDENTE",
      categoryId: catIds["Venda de Cana"],
      bankAccountId: bankAccount.id,
      description: "Venda colheita Talhao 2 - Usina Santa Rita",
      amount: 103489.20,
      dueDate: new Date("2025-04-10"),
      harvestId: harvest3.id,
    },
  })

  // More expense transactions
  await prisma.transaction.create({
    data: {
      farmId,
      type: "DESPESA",
      status: "PAGO",
      categoryId: catIds["Fertilizantes"],
      bankAccountId: bankAccount.id,
      description: "Compra de KCl e Ureia - safra 25/26",
      amount: 8850,
      dueDate: new Date("2025-05-10"),
      paymentDate: new Date("2025-05-10"),
      supplierId: supplier1.id,
    },
  })

  await prisma.transaction.create({
    data: {
      farmId,
      type: "DESPESA",
      status: "PAGO",
      categoryId: catIds["Combustivel"],
      bankAccountId: bankAccount.id,
      description: "Diesel S10 - tanque da fazenda",
      amount: 12400,
      dueDate: new Date("2025-06-01"),
      paymentDate: new Date("2025-06-01"),
    },
  })

  await prisma.transaction.create({
    data: {
      farmId,
      type: "DESPESA",
      status: "PENDENTE",
      categoryId: catIds["Servicos Mecanizados"],
      bankAccountId: bankAccount.id,
      description: "Servico de colheita mecanizada - safra 24/25",
      amount: 45000,
      dueDate: new Date("2025-08-15"),
    },
  })

  await prisma.transaction.create({
    data: {
      farmId,
      type: "DESPESA",
      status: "PENDENTE",
      categoryId: catIds["Mao de Obra"],
      bankAccountId: bankAccount.id,
      description: "Folha de pagamento - Julho 2025",
      amount: 18500,
      dueDate: new Date("2025-08-05"),
    },
  })

  console.log("Seed completed!")
  console.log("  User: admin@farmcore.app / admin123")
  console.log("  Farm: Fazenda Sao Paulo (78.82 ha)")
  console.log("  Areas: 8 talhoes")
  console.log("  Crops: 2 safras (24/25 finalizada, 25/26 em andamento)")
  console.log("  Inputs: 8 insumos com estoque inicial")
  console.log("  Activities: 4 atividades (2 concluidas, 1 em progresso, 1 a fazer)")
  console.log("  Soil Analyses: 5 laudos (Talhao 1: 3 anos, Talhao 5: 2 anos)")
  console.log("  Harvests: 3 colheitas da safra 24/25")
  console.log("  Transactions: 7 transacoes (receitas e despesas)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

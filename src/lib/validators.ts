import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Senha deve ter no minimo 6 caracteres"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter no minimo 2 caracteres"),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "Senha deve ter no minimo 6 caracteres"),
  farmName: z.string().min(2, "Nome da fazenda deve ter no minimo 2 caracteres"),
})

export const farmSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio"),
  city: z.string().optional(),
  state: z.string().optional(),
  document: z.string().optional(),
})

export const areaSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio"),
  sizeHa: z.coerce.number().positive("Area deve ser maior que zero"),
  geojson: z.any().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  description: z.string().optional(),
})

export const cropSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio"),
  culture: z.string().min(1, "Cultura e obrigatoria"),
  plantingType: z.enum(["CANA_PLANTA", "SOQUEIRA", "OUTRO"]),
  variety: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["PLANEJADA", "EM_ANDAMENTO", "FINALIZADA"]).default("PLANEJADA"),
  measurementUnit: z.string().optional(),
  defaultInputStockId: z.string().optional(),
  grossWeightDiscounts: z.array(z.string()).optional(),
  netWeightDiscounts: z.array(z.string()).optional(),
  notes: z.string().optional(),
  areaIds: z.array(z.string()).min(1, "Selecione pelo menos uma area"),
})

export const activitySchema = z.object({
  activityTypeId: z.string().min(1, "Tipo e obrigatorio"),
  subtype: z.string().optional(),
  cropId: z.string().optional(),
  team: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["A_FAZER", "EM_PROGRESSO", "REVISAR", "CONCLUIDO"]).default("A_FAZER"),
  kind: z.enum(["PLANEJADO", "REALIZADO"]).default("REALIZADO"),
  plannedActivityId: z.string().optional(),
  stockId: z.string().optional(),
  notes: z.string().optional(),
  areaIds: z.array(z.string()).min(1, "Selecione pelo menos uma area"),
  inputUsages: z.array(z.object({
    inputId: z.string(),
    quantity: z.coerce.number().positive(),
    ratePerHa: z.coerce.number().optional(),
  })).optional(),
})

export const inputSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio"),
  category: z.enum(["HERBICIDA", "INSETICIDA", "FUNGICIDA", "FERTILIZANTE", "ADJUVANTE", "SEMENTE", "COMBUSTIVEL", "OUTRO"]),
  unit: z.enum(["KG", "L", "T", "UNIDADE", "SACO", "ML", "G"]).default("L"),
  manufacturer: z.string().optional(),
  activeAgent: z.string().optional(),
  description: z.string().optional(),
  minStock: z.coerce.number().min(0).optional(),
})

export const soilAnalysisSchema = z.object({
  areaId: z.string().min(1, "Area e obrigatoria"),
  sampleDate: z.coerce.date(),
  year: z.coerce.number().int().min(2000).max(2100),
  depth: z.string().default("0-20"),
  labName: z.string().optional(),
  labReportId: z.string().optional(),
  pH: z.coerce.number().min(0).max(14).optional().or(z.literal("")),
  pHType: z.string().default("CaCl2"),
  organicMatter: z.coerce.number().min(0).optional().or(z.literal("")),
  phosphorus: z.coerce.number().min(0).optional().or(z.literal("")),
  potassium: z.coerce.number().min(0).optional().or(z.literal("")),
  calcium: z.coerce.number().min(0).optional().or(z.literal("")),
  magnesium: z.coerce.number().min(0).optional().or(z.literal("")),
  aluminum: z.coerce.number().min(0).optional().or(z.literal("")),
  hPlusAl: z.coerce.number().min(0).optional().or(z.literal("")),
  sumOfBases: z.coerce.number().min(0).optional().or(z.literal("")),
  ctc: z.coerce.number().min(0).optional().or(z.literal("")),
  baseSaturation: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  aluminumSaturation: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  sulfur: z.coerce.number().min(0).optional().or(z.literal("")),
  boron: z.coerce.number().min(0).optional().or(z.literal("")),
  copper: z.coerce.number().min(0).optional().or(z.literal("")),
  iron: z.coerce.number().min(0).optional().or(z.literal("")),
  manganese: z.coerce.number().min(0).optional().or(z.literal("")),
  zinc: z.coerce.number().min(0).optional().or(z.literal("")),
  clayPercent: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  siltPercent: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  sandPercent: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  textureClass: z.string().optional(),
  notes: z.string().optional(),
})

export const bankAccountSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio"),
  bankName: z.string().optional(),
  agency: z.string().optional(),
  accountNumber: z.string().optional(),
  initialBalance: z.coerce.number().default(0),
  initialBalanceDate: z.coerce.date().default(() => new Date()),
})

export const transactionSchema = z.object({
  type: z.enum(["RECEITA", "DESPESA"]),
  categoryId: z.string().optional(),
  bankAccountId: z.string().optional(),
  description: z.string().min(1, "Descricao e obrigatoria"),
  amount: z.coerce.number().positive("Valor deve ser positivo"),
  dueDate: z.coerce.date(),
  paymentDate: z.coerce.date().optional(),
  competenceDate: z.coerce.date().optional(),
  documentNumber: z.string().optional(),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
  installments: z.coerce.number().int().min(1).max(120).default(1),
})

export const supplierSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio"),
  document: z.string().optional(),
  types: z.array(z.enum(["PRODUTOS", "SERVICOS", "OUTRO"])).min(1, "Selecione pelo menos um tipo").default(["OUTRO"]),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Email invalido").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Fornecedor e obrigatorio"),
  purchaseDate: z.coerce.date(),
  deliveryDate: z.coerce.date().optional(),
  invoiceNumber: z.string().optional(),
  invoiceKey: z.string().optional(),
  discountAmount: z.coerce.number().min(0).default(0),
  freightAmount: z.coerce.number().min(0).default(0),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    inputId: z.string().optional(),
    description: z.string().min(1),
    quantity: z.coerce.number().positive(),
    unit: z.enum(["KG", "L", "T", "UNIDADE", "SACO", "ML", "G"]),
    unitPrice: z.coerce.number().positive(),
  })).min(1, "Adicione pelo menos um item"),
})

export const certificateUploadSchema = z.object({
  password: z.string().min(1, "Senha do certificado e obrigatoria"),
})

export const approveNfeSchema = z.object({
  nfeImportId: z.string().min(1),
  supplierId: z.string().optional(),
  categoryId: z.string().optional(),
  bankAccountId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().optional(),
})

export const rejectNfeSchema = z.object({
  nfeImportId: z.string().min(1),
  rejectionReason: z.string().optional(),
})

export const harvestSchema = z.object({
  cropId: z.string().min(1, "Safra e obrigatoria"),
  areaId: z.string().min(1, "Area e obrigatoria"),
  harvestDate: z.coerce.date(),
  totalTons: z.coerce.number().positive("Tonelagem deve ser positiva"),
  tch: z.coerce.number().optional(),
  atr: z.coerce.number().optional(),
  brix: z.coerce.number().optional(),
  pol: z.coerce.number().optional(),
  fiber: z.coerce.number().optional(),
  purity: z.coerce.number().optional(),
  salePrice: z.coerce.number().optional(),
  buyerName: z.string().optional(),
  ticketNumber: z.string().optional(),
  notes: z.string().optional(),
})

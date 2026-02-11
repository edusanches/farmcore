import { type FarmRole, type ActivityStatus, type InputCategory, type UnitOfMeasure, type PlantingType, type CropStatus, type TransactionType, type TransactionStatus, type PurchaseStatus } from "@/generated/prisma/client"

export const FARM_ROLE_LABELS: Record<FarmRole, string> = {
  OWNER: "Proprietario",
  MANAGER: "Gerente",
  ACCOUNTANT: "Contador",
  WORKER: "Trabalhador",
  VIEWER: "Visualizador",
}

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  A_FAZER: "A Fazer",
  EM_PROGRESSO: "Em Progresso",
  CONCLUIDO: "Concluido",
}

export const ACTIVITY_STATUS_COLORS: Record<ActivityStatus, string> = {
  A_FAZER: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  EM_PROGRESSO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  CONCLUIDO: "bg-green-500/20 text-green-400 border-green-500/30",
}

export const INPUT_CATEGORY_LABELS: Record<InputCategory, string> = {
  HERBICIDA: "Herbicida",
  INSETICIDA: "Inseticida",
  FUNGICIDA: "Fungicida",
  FERTILIZANTE: "Fertilizante",
  ADJUVANTE: "Adjuvante",
  SEMENTE: "Semente",
  COMBUSTIVEL: "Combustivel",
  OUTRO: "Outro",
}

export const UNIT_LABELS: Record<UnitOfMeasure, string> = {
  KG: "kg",
  L: "L",
  T: "t",
  UNIDADE: "un",
  SACO: "sc",
  ML: "mL",
  G: "g",
}

export const PLANTING_TYPE_LABELS: Record<PlantingType, string> = {
  CANA_PLANTA: "Cana-planta",
  SOQUEIRA: "Soqueira",
  OUTRO: "Outro",
}

export const CROP_STATUS_LABELS: Record<CropStatus, string> = {
  PLANEJADA: "Planejada",
  EM_ANDAMENTO: "Em Andamento",
  FINALIZADA: "Finalizada",
}

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  RECEITA: "Receita",
  DESPESA: "Despesa",
}

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  RECEBIDO: "Recebido",
  CANCELADO: "Cancelado",
  ATRASADO: "Atrasado",
}

export const TRANSACTION_STATUS_COLORS: Record<TransactionStatus, string> = {
  PENDENTE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  PAGO: "bg-green-500/20 text-green-400 border-green-500/30",
  RECEBIDO: "bg-green-500/20 text-green-400 border-green-500/30",
  CANCELADO: "bg-muted text-muted-foreground border-muted",
  ATRASADO: "bg-red-500/20 text-red-400 border-red-500/30",
}

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  RASCUNHO: "Rascunho",
  CONFIRMADA: "Confirmada",
  RECEBIDA: "Recebida",
  CANCELADA: "Cancelada",
}

export const SUGARCANE_IDEAL_RANGES = {
  pH: { min: 5.5, max: 6.5, unit: "", label: "pH" },
  organicMatter: { min: 15, max: 30, unit: "g/dm3", label: "Materia Organica" },
  phosphorus: { min: 15, max: 40, unit: "mg/dm3", label: "Fosforo (P)" },
  potassium: { min: 3.0, max: 6.0, unit: "mmolc/dm3", label: "Potassio (K)" },
  calcium: { min: 25, max: 60, unit: "mmolc/dm3", label: "Calcio (Ca)" },
  magnesium: { min: 8, max: 20, unit: "mmolc/dm3", label: "Magnesio (Mg)" },
  baseSaturation: { min: 60, max: 80, unit: "%", label: "Saturacao por Bases (V%)" },
  aluminumSaturation: { min: 0, max: 5, unit: "%", label: "Sat. por Aluminio (m%)" },
  sulfur: { min: 5, max: 15, unit: "mg/dm3", label: "Enxofre (S)" },
  boron: { min: 0.2, max: 0.6, unit: "mg/dm3", label: "Boro (B)" },
  copper: { min: 0.5, max: 1.5, unit: "mg/dm3", label: "Cobre (Cu)" },
  iron: { min: 5, max: 12, unit: "mg/dm3", label: "Ferro (Fe)" },
  manganese: { min: 1.5, max: 5.0, unit: "mg/dm3", label: "Manganes (Mn)" },
  zinc: { min: 0.7, max: 1.5, unit: "mg/dm3", label: "Zinco (Zn)" },
} as const

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR").format(new Date(date))
}

import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  ClipboardList,
  DollarSign,
  FileText,
  FlaskConical,
  Grid3x3,
  Home,
  LayoutDashboard,
  Leaf,
  Map,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  Wallet,
} from "lucide-react"

// --- Types ---

export type NavContextLevel = "farm" | "safra" | "area"

export interface NavContext {
  level: NavContextLevel
  safraId?: string
  areaId?: string
}

export interface NavItem {
  title: string
  icon: LucideIcon
  href: string
  exact?: boolean
}

export interface NavSection {
  label: string
  items: NavItem[]
}

// --- Context derivation ---

export function deriveNavContext(pathname: string): NavContext {
  const areaMatch = pathname.match(/^\/safras\/([^/]+)\/areas\/([^/]+)/)
  if (areaMatch) {
    return { level: "area", safraId: areaMatch[1], areaId: areaMatch[2] }
  }

  const safraMatch = pathname.match(/^\/safras\/([^/]+)/)
  if (safraMatch && safraMatch[1] !== "nova") {
    return { level: "safra", safraId: safraMatch[1] }
  }

  return { level: "farm" }
}

// --- Menu definitions ---

const farmNavSections: NavSection[] = [
  {
    label: "Principal",
    items: [
      { title: "Inicio", href: "/dashboard", icon: Home },
      { title: "Mapa", href: "/mapa", icon: Map },
      { title: "Areas", href: "/areas", icon: Grid3x3 },
      { title: "Safras", href: "/safras", icon: Leaf },
    ],
  },
  {
    label: "Operacoes",
    items: [
      { title: "Atividades", href: "/atividades", icon: ClipboardList },
      { title: "Analise de Solo", href: "/analise-solo", icon: FlaskConical },
      { title: "Insumos", href: "/insumos", icon: Package },
      { title: "Colheita", href: "/colheita", icon: Truck },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Financeiro", href: "/financeiro", icon: Wallet },
      { title: "Compras", href: "/compras", icon: ShoppingCart },
      { title: "Fornecedores", href: "/fornecedores", icon: Store },
      { title: "Notas Fiscais", href: "/notas-fiscais", icon: FileText },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Indicadores", href: "/indicadores", icon: BarChart3 },
      { title: "Configuracoes", href: "/configuracoes", icon: Settings },
    ],
  },
]

// Hrefs are suffixes — prefixed with /safras/[safraId] by getNavSections
const safraNavSections: NavSection[] = [
  {
    label: "Safra",
    items: [
      { title: "Painel de Controle", href: "", icon: LayoutDashboard, exact: true },
      { title: "Mapa", href: "/mapa", icon: Map },
      { title: "Atividades", href: "/atividades", icon: ClipboardList },
      { title: "Insumos", href: "/insumos", icon: Package },
      { title: "Colheita", href: "/colheita", icon: Truck },
    ],
  },
  {
    label: "Custos",
    items: [
      { title: "Custo Orcado", href: "/custo-orcado", icon: DollarSign },
      { title: "Custo Realizado", href: "/custo", icon: DollarSign },
    ],
  },
  {
    label: "Analise",
    items: [
      { title: "Indicadores", href: "/indicadores", icon: BarChart3 },
    ],
  },
]

// Hrefs are suffixes — prefixed with /safras/[safraId]/areas/[areaId] by getNavSections
const areaNavSections: NavSection[] = [
  {
    label: "Talhao",
    items: [
      { title: "Painel de Controle", href: "", icon: LayoutDashboard, exact: true },
      { title: "Mapa", href: "/mapa", icon: Map },
      { title: "Insumos", href: "/insumos", icon: Package },
      { title: "Custo Realizado", href: "/custo", icon: DollarSign },
    ],
  },
]

// --- Resolver ---

function prefixSections(sections: NavSection[], basePath: string): NavSection[] {
  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      href: basePath + item.href,
    })),
  }))
}

export function getNavSections(context: NavContext): NavSection[] {
  switch (context.level) {
    case "area":
      return prefixSections(
        areaNavSections,
        `/safras/${context.safraId}/areas/${context.areaId}`
      )
    case "safra":
      return prefixSections(safraNavSections, `/safras/${context.safraId}`)
    default:
      return farmNavSections
  }
}

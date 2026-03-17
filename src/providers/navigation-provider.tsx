"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import { useFarm } from "@/providers/farm-provider"
import {
  deriveNavContext,
  getNavSections,
  type NavContext,
  type NavSection,
} from "@/lib/navigation"

interface SafraSummary {
  id: string
  name: string
  status: string
}

interface AreaSummary {
  id: string
  name: string
  sizeHa: number
}

interface NavigationContextType {
  context: NavContext
  navSections: NavSection[]
  /** All crops for the active farm (for the safra dropdown) */
  safras: SafraSummary[]
  /** Current safra data (when in safra/area level) */
  safra: SafraSummary | null
  /** Areas linked to the current safra (for the area dropdown) */
  safraAreas: AreaSummary[]
  /** Current area data (when in area level) */
  area: AreaSummary | null
  /** Whether data is still loading */
  loading: boolean
}

const NavigationCtx = createContext<NavigationContextType>({
  context: { level: "farm" },
  navSections: [],
  safras: [],
  safra: null,
  safraAreas: [],
  area: null,
  loading: false,
})

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { activeFarm } = useFarm()
  const farmId = activeFarm?.farmId

  const context = useMemo(() => deriveNavContext(pathname), [pathname])
  const navSections = useMemo(() => getNavSections(context), [context])

  const [safras, setSafras] = useState<SafraSummary[]>([])
  const [safraAreas, setSafraAreas] = useState<AreaSummary[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch all safras for the farm (for dropdown)
  useEffect(() => {
    if (!farmId) {
      setSafras([])
      return
    }
    setLoading(true)
    fetch(`/api/crops?farmId=${farmId}`)
      .then((r) => r.json())
      .then((data) => setSafras(Array.isArray(data) ? data : []))
      .catch(() => setSafras([]))
      .finally(() => setLoading(false))
  }, [farmId])

  // Fetch areas for the current safra (for area dropdown)
  useEffect(() => {
    if (!farmId || !context.safraId) {
      setSafraAreas([])
      return
    }
    fetch(`/api/crops/${context.safraId}/areas?farmId=${farmId}`)
      .then((r) => r.json())
      .then((data) => setSafraAreas(Array.isArray(data) ? data : []))
      .catch(() => setSafraAreas([]))
  }, [farmId, context.safraId])

  const safra = useMemo(
    () => safras.find((s) => s.id === context.safraId) ?? null,
    [safras, context.safraId]
  )

  const area = useMemo(
    () => safraAreas.find((a) => a.id === context.areaId) ?? null,
    [safraAreas, context.areaId]
  )

  const value = useMemo<NavigationContextType>(
    () => ({ context, navSections, safras, safra, safraAreas, area, loading }),
    [context, navSections, safras, safra, safraAreas, area, loading]
  )

  return (
    <NavigationCtx.Provider value={value}>{children}</NavigationCtx.Provider>
  )
}

export function useNavigation() {
  return useContext(NavigationCtx)
}

"use client"

import { useEffect, useState } from "react"

type Area = { id: string; name: string; sizeHa: number }

export function useAreas(farmId: string | undefined) {
  const [areas, setAreas] = useState<Area[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!farmId) return
    setLoading(true)
    fetch(`/api/areas?farmId=${farmId}`)
      .then((r) => r.json())
      .then(setAreas)
      .finally(() => setLoading(false))
  }, [farmId])

  return { areas, loading }
}

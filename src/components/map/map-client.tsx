"use client"

import dynamic from "next/dynamic"
import type { MapArea } from "./farm-map"

const FarmMap = dynamic(() => import("./farm-map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] rounded-md border bg-muted/50">
      <p className="text-muted-foreground">Carregando mapa...</p>
    </div>
  ),
})

interface MapClientProps {
  areas: MapArea[]
}

export function MapClient({ areas }: MapClientProps) {
  return <FarmMap areas={areas} />
}

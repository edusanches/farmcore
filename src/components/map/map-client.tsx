"use client"

import dynamic from "next/dynamic"
import type { MapArea, NdviData } from "./farm-map"

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
  ndviData?: NdviData[]
  showNdviImages?: boolean
}

export function MapClient({ areas, ndviData, showNdviImages }: MapClientProps) {
  return <FarmMap areas={areas} ndviData={ndviData} showNdviImages={showNdviImages} />
}

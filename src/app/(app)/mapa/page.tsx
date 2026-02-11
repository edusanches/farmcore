import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { getAreas } from "@/queries/areas"
import { MapClient } from "@/components/map/map-client"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import type { MapArea } from "@/components/map/farm-map"

export default async function MapaPage() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")

  const dbAreas = await getAreas(membership.farmId)

  const areas: MapArea[] = dbAreas
    .filter((a) => a.geojson !== null && a.geojson !== undefined)
    .map((a) => ({
      id: a.id,
      name: a.name,
      color: a.color ?? "#22c55e",
      geojson: a.geojson as unknown as MapArea["geojson"],
      sizeHa: a.sizeHa,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mapa</h1>
        <p className="text-muted-foreground">
          Visualize suas areas e talhoes no mapa
        </p>
      </div>

      {areas.length > 0 ? (
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-md">
            <div className="h-[600px]">
              <MapClient areas={areas} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="min-h-[600px]">
          <CardContent className="flex flex-col items-center justify-center h-[600px]">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-muted p-6">
                <MapPin className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Nenhuma area com geometria
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Cadastre areas com dados GeoJSON para visualiza-las no mapa.
                  Voce pode importar arquivos KML na tela de cadastro de areas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

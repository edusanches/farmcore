import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { getCrops } from "@/queries/crops"
import Link from "next/link"
import { Plus, Sprout, MapPin, ClipboardList } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "PLANNING":
      return "outline"
    case "PLANTING":
      return "default"
    case "GROWING":
      return "default"
    case "HARVESTING":
      return "default"
    case "COMPLETED":
      return "secondary"
    case "CANCELLED":
      return "destructive"
    default:
      return "outline"
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PLANNING":
      return "Planejamento"
    case "PLANTING":
      return "Plantio"
    case "GROWING":
      return "Crescimento"
    case "HARVESTING":
      return "Colheita"
    case "COMPLETED":
      return "Concluida"
    case "CANCELLED":
      return "Cancelada"
    default:
      return status
  }
}

function getPlantingTypeLabel(type: string) {
  switch (type) {
    case "PLANTA":
      return "Planta"
    case "SOCA":
      return "Soca"
    case "RESSOCA":
      return "Ressoca"
    default:
      return type
  }
}

export default async function SafrasPage() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")
  const farmId = membership.farmId

  const crops = await getCrops(farmId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Safras</h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie as safras da sua fazenda
          </p>
        </div>
        <Button asChild>
          <Link href="/safras/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova Safra
          </Link>
        </Button>
      </div>

      {crops.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Sprout className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              Nenhuma safra cadastrada
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Comece cadastrando a primeira safra da sua fazenda.
            </p>
            <Button asChild>
              <Link href="/safras/nova">
                <Plus className="mr-2 h-4 w-4" />
                Nova Safra
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {crops.map((crop) => (
            <Link key={crop.id} href={`/safras/${crop.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{crop.name}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(crop.status)}>
                      {getStatusLabel(crop.status)}
                    </Badge>
                  </div>
                  {crop.plantingType && (
                    <CardDescription>
                      <Badge variant="outline" className="mt-1">
                        {getPlantingTypeLabel(crop.plantingType)}
                      </Badge>
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {crop.cropAreas?.length ?? 0}{" "}
                      {(crop.cropAreas?.length ?? 0) === 1
                        ? "area vinculada"
                        : "areas vinculadas"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ClipboardList className="h-4 w-4" />
                    <span>
                      {crop._count?.activities ?? 0}{" "}
                      {(crop._count?.activities ?? 0) === 1
                        ? "atividade"
                        : "atividades"}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  {crop.startDate && (
                    <p className="text-xs text-muted-foreground">
                      Inicio:{" "}
                      {new Date(crop.startDate).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

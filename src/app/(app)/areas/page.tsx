import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { getAreas } from "@/queries/areas"
import { formatNumber } from "@/lib/constants"
import Link from "next/link"
import { Plus, MapPin, Leaf } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function AreasPage() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")
  const farmId = membership.farmId

  const areas = await getAreas(farmId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Areas</h1>
          <p className="text-muted-foreground">
            Gerencie as areas de cultivo da sua fazenda
          </p>
        </div>
        <Button asChild>
          <Link href="/areas/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova Area
          </Link>
        </Button>
      </div>

      {areas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              Nenhuma area cadastrada
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Comece cadastrando a primeira area da sua fazenda.
            </p>
            <Button asChild>
              <Link href="/areas/nova">
                <Plus className="mr-2 h-4 w-4" />
                Nova Area
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Todas as Areas</CardTitle>
            <CardDescription>
              {areas.length} {areas.length === 1 ? "area cadastrada" : "areas cadastradas"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tamanho (ha)</TableHead>
                  <TableHead>Safras Ativas</TableHead>
                  <TableHead>Analises</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell>
                      <Link
                        href={`/areas/${area.id}`}
                        className="font-medium hover:underline"
                      >
                        {area.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {formatNumber(area.sizeHa)} ha
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Leaf className="h-4 w-4 text-green-600" />
                        <span>{area.cropAreas.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {area._count.soilAnalyses}
                    </TableCell>
                    <TableCell>
                      <Badge variant={area.active ? "default" : "secondary"}>
                        {area.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

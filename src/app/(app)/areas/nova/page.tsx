"use client"

import { useTransition, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, MapPin } from "lucide-react"
import { toast } from "sonner"
import type { GeoJsonObject } from "geojson"

import { areaSchema } from "@/lib/validators"
import { createArea } from "@/actions/areas"
import { useFarm } from "@/providers/farm-provider"
import { AreaDrawClient } from "@/components/map/area-draw-client"
import { KmlUploader } from "@/components/map/kml-uploader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type AreaFormValues = z.infer<typeof areaSchema>

export default function NovaAreaPage() {
  const [isPending, startTransition] = useTransition()
  const [geojson, setGeojson] = useState<GeoJsonObject | null>(null)
  const router = useRouter()
  const { activeFarm } = useFarm()

  const form = useForm<AreaFormValues>({
    resolver: zodResolver(areaSchema) as any,
    defaultValues: {
      name: "",
      sizeHa: 0,
      color: "#22c55e",
      description: "",
    },
  })

  const watchColor = form.watch("color") || "#22c55e"

  const handleGeoJsonChange = useCallback(
    (newGeojson: GeoJsonObject | null, areaHa: number) => {
      setGeojson(newGeojson)
      if (areaHa > 0) {
        form.setValue("sizeHa", areaHa, { shouldValidate: true })
      }
    },
    [form]
  )

  const handleKmlLoaded = useCallback(
    (kmlGeojson: unknown) => {
      setGeojson(kmlGeojson as GeoJsonObject)
      // Calculate area from KML - will be recalculated when the map loads it
    },
    []
  )

  function onSubmit(values: AreaFormValues) {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("name", values.name)
        formData.append("sizeHa", String(values.sizeHa))
        if (values.color) formData.append("color", values.color)
        if (values.description) formData.append("description", values.description)
        if (geojson) formData.append("geojson", JSON.stringify(geojson))

        await createArea(activeFarm.farmId, formData)
        toast.success("Area criada com sucesso")
        router.push("/areas")
      } catch (error) {
        toast.error("Erro ao criar area")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Area</h1>
        <p className="text-muted-foreground mt-1">
          Cadastre uma nova area na fazenda
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Map Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Desenhar Area no Mapa
              </CardTitle>
              <CardDescription>
                Desenhe o poligono da area diretamente no mapa ou importe um arquivo KML.
                A area em hectares sera calculada automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <KmlUploader onGeoJsonLoaded={handleKmlLoaded} />
                {geojson && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setGeojson(null)
                      form.setValue("sizeHa", 0)
                    }}
                  >
                    Limpar geometria
                  </Button>
                )}
              </div>
              <div className="h-[600px] rounded-md border overflow-hidden">
                <AreaDrawClient
                  geojson={geojson}
                  color={watchColor}
                  onGeoJsonChange={handleGeoJsonChange}
                />
              </div>
              {geojson && (
                <p className="text-sm text-muted-foreground">
                  Geometria definida. Area calculada: {form.getValues("sizeHa")} ha
                </p>
              )}
            </CardContent>
          </Card>

          {/* Data Card */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Area</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Talhao 1" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sizeHa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tamanho (ha)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="12.50"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor no mapa</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-3">
                          <Input
                            type="color"
                            className="h-10 w-14 cursor-pointer p-1"
                            disabled={isPending}
                            {...field}
                          />
                          <Input
                            placeholder="#22c55e"
                            disabled={isPending}
                            value={field.value ?? ""}
                            onChange={field.onChange}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descricao</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observacoes sobre esta area..."
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Area
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

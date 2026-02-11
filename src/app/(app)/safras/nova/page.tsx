"use client"

import { useTransition, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { cropSchema } from "@/lib/validators"
import { createCrop } from "@/actions/crops"
import { useFarm } from "@/providers/farm-provider"
import { PLANTING_TYPE_LABELS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import type { PlantingType } from "@/generated/prisma/client"

type CropFormValues = z.infer<typeof cropSchema>

interface AreaOption {
  id: string
  name: string
  sizeHa: number
}

export default function NovaSafraPage() {
  const [isPending, startTransition] = useTransition()
  const [areas, setAreas] = useState<AreaOption[]>([])
  const router = useRouter()
  const { activeFarm } = useFarm()

  const form = useForm<CropFormValues>({
    resolver: zodResolver(cropSchema) as any,
    defaultValues: {
      name: "",
      plantingType: "CANA_PLANTA",
      variety: "",
      status: "PLANEJADA",
      notes: "",
      areaIds: [],
    },
  })

  useEffect(() => {
    if (!activeFarm) return
    fetch(`/api/areas?farmId=${activeFarm.farmId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAreas(data))
      .catch(() => {})
  }, [activeFarm])

  function onSubmit(values: CropFormValues) {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        await createCrop(activeFarm.farmId, values)
        toast.success("Safra criada com sucesso")
        router.push("/safras")
      } catch (error) {
        toast.error("Erro ao criar safra")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Safra</h1>
        <p className="text-muted-foreground mt-1">Cadastre uma nova safra</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Safra</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Cana 25/26 (Soqueira)" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plantingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Plantio</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PLANTING_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="variety"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variedade</FormLabel>
                      <FormControl>
                        <Input placeholder="RB966928" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Inicio</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          disabled={isPending}
                          value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observacoes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notas sobre esta safra..." disabled={isPending} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3">
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Safra
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
        </CardContent>
      </Card>
    </div>
  )
}

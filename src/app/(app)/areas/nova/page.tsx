"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { areaSchema } from "@/lib/validators"
import { createArea } from "@/actions/areas"
import { useFarm } from "@/providers/farm-provider"
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

type AreaFormValues = z.infer<typeof areaSchema>

export default function NovaAreaPage() {
  const [isPending, startTransition] = useTransition()
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

  function onSubmit(values: AreaFormValues) {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append("name", values.name)
        formData.append("sizeHa", String(values.sizeHa))
        if (values.color) formData.append("color", values.color)
        if (values.description) formData.append("description", values.description)

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
        <p className="text-muted-foreground mt-1">Cadastre uma nova area na fazenda</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Area</CardTitle>
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
        </CardContent>
      </Card>
    </div>
  )
}

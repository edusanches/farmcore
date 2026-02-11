"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, DollarSign } from "lucide-react"
import { toast } from "sonner"

import { transactionSchema } from "@/lib/validators"
import { createTransaction } from "@/actions/financial"
import { useFarm } from "@/providers/farm-provider"
import { TRANSACTION_TYPE_LABELS } from "@/lib/constants"
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

type TransactionFormValues = z.infer<typeof transactionSchema>

export default function NovaTransacaoPage() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { activeFarm } = useFarm()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema) as any,
    defaultValues: {
      type: "DESPESA",
      categoryId: "",
      bankAccountId: "",
      description: "",
      amount: 0,
      dueDate: new Date(),
      documentNumber: "",
      supplierId: "",
      notes: "",
      installments: 1,
    },
  })

  function onSubmit(values: TransactionFormValues) {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        await createTransaction(activeFarm.farmId, values)
        toast.success("Transacao registrada com sucesso")
        router.push("/financeiro")
      } catch (error) {
        toast.error("Erro ao registrar transacao")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nova Transacao</h1>
        <p className="text-muted-foreground mt-1">
          Registre uma nova receita ou despesa
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Tipo e Dados Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Dados da Transacao
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descricao</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Descricao da transacao"
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          disabled={isPending}
                          {...field}
                          value={field.value != null ? String(field.value) : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcelas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={120}
                          placeholder="1"
                          disabled={isPending}
                          {...field}
                          value={field.value != null ? String(field.value) : "1"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ID da categoria"
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
                  name="bankAccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conta Bancaria</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ID da conta bancaria"
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
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fornecedor</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ID do fornecedor"
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
                  name="documentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numero do Documento</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="NF, boleto, etc."
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

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle>Datas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Vencimento</FormLabel>
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

                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Pagamento</FormLabel>
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

                <FormField
                  control={form.control}
                  name="competenceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Competencia</FormLabel>
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
            </CardContent>
          </Card>

          {/* Observacoes */}
          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observacoes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observacoes sobre a transacao..."
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending} size="lg">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Transacao
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
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

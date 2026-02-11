import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/constants"
import { prisma } from "@/lib/prisma"
import {
  DollarSign,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  FlaskConical,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default async function IndicadoresPage() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")
  const farmId = membership.farmId

  const [totalRevenue, totalExpense, totalArea] = await Promise.all([
    prisma.transaction.aggregate({
      where: { farmId, type: "RECEITA" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { farmId, type: "DESPESA" },
      _sum: { amount: true },
    }),
    prisma.area.aggregate({
      where: { farmId },
      _sum: { sizeHa: true },
    }),
  ])

  const revenue = Number(totalRevenue._sum.amount ?? 0)
  const expense = Number(totalExpense._sum.amount ?? 0)
  const hectares = Number(totalArea._sum.sizeHa ?? 0)
  const costPerHectare = hectares > 0 ? expense / hectares : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Indicadores</h1>
        <p className="text-muted-foreground">
          Relatórios e indicadores de desempenho da fazenda
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Custo por Hectare
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(costPerHectare)}
            </div>
            <p className="text-xs text-muted-foreground">
              {hectares > 0
                ? `baseado em ${hectares.toFixed(1)} ha`
                : "nenhuma área cadastrada"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produtividade Média (TCH)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">
              dados de safra pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Receita Total
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              todas as receitas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Despesa Total
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(expense)}
            </div>
            <p className="text-xs text-muted-foreground">
              todas as despesas registradas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Despesas por Categoria
            </CardTitle>
            <CardDescription>
              Distribuição dos custos por categoria
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="space-y-3 w-full">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-4/5" />
              <Skeleton className="h-8 w-3/5" />
              <Skeleton className="h-8 w-2/5" />
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Em desenvolvimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução Mensal
            </CardTitle>
            <CardDescription>
              Receitas x Despesas ao longo dos meses
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="space-y-3 w-full">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-11/12" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-10/12" />
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Em desenvolvimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Custo por Hectare por Safra
            </CardTitle>
            <CardDescription>
              Comparativo entre safras
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="space-y-3 w-full">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-8 w-5/6" />
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Em desenvolvimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Fertilidade do Solo
            </CardTitle>
            <CardDescription>
              Evolução dos indicadores de solo por área
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="space-y-3 w-full">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-4/5" />
              <Skeleton className="h-8 w-full" />
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              Em desenvolvimento
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

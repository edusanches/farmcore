"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { BadgeCheck, LogOut, Settings } from "lucide-react"
import { signOut } from "next-auth/react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/layout/theme-toggle"

interface AppHeaderProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

const routeLabels: Record<string, string> = {
  dashboard: "Inicio",
  mapa: "Mapa",
  areas: "Areas",
  safras: "Safras",
  atividades: "Atividades",
  "analise-solo": "Analise de Solo",
  insumos: "Insumos",
  colheita: "Colheita",
  financeiro: "Financeiro",
  compras: "Compras",
  indicadores: "Indicadores",
  configuracoes: "Configuracoes",
  perfil: "Perfil",
}

function getInitials(name?: string | null) {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function AppHeader({ user }: AppHeaderProps) {
  const pathname = usePathname()

  const segments = pathname.split("/").filter(Boolean)

  const breadcrumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/")
    const label = routeLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
    const isLast = index === segments.length - 1
    return { href, label, isLast }
  })

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-accent transition-colors outline-none">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? "Usuario"} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-lg">
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image ?? undefined} alt={user.name ?? "Usuario"} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name ?? "Usuario"}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/perfil" className="gap-2">
                <BadgeCheck className="size-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/configuracoes" className="gap-2">
                <Settings className="size-4" />
                Configuracoes
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

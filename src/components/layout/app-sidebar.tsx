"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  BadgeCheck,
  BarChart3,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  FlaskConical,
  Grid3x3,
  Home,
  Leaf,
  LogOut,
  Map,
  Package,
  Settings,
  ShoppingCart,
  Sprout,
  Truck,
  Wallet,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useFarm } from "@/providers/farm-provider"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Farm {
  id: string
  name: string
}

interface FarmMembership {
  id: string
  farmId: string
  role: string
  farm: Farm
}

interface AppSidebarProps {
  farms: FarmMembership[]
  activeFarm: FarmMembership | null
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

const navSections = [
  {
    label: "Principal",
    items: [
      { title: "Inicio", href: "/dashboard", icon: Home },
      { title: "Mapa", href: "/mapa", icon: Map },
      { title: "Areas", href: "/areas", icon: Grid3x3 },
      { title: "Safras", href: "/safras", icon: Leaf },
    ],
  },
  {
    label: "Operacoes",
    items: [
      { title: "Atividades", href: "/atividades", icon: ClipboardList },
      { title: "Analise de Solo", href: "/analise-solo", icon: FlaskConical },
      { title: "Insumos", href: "/insumos", icon: Package },
      { title: "Colheita", href: "/colheita", icon: Truck },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Financeiro", href: "/financeiro", icon: Wallet },
      { title: "Compras", href: "/compras", icon: ShoppingCart },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Indicadores", href: "/indicadores", icon: BarChart3 },
      { title: "Configuracoes", href: "/configuracoes", icon: Settings },
    ],
  },
]

function getInitials(name?: string | null) {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function AppSidebar({ farms, activeFarm: initialActiveFarm, user }: AppSidebarProps) {
  const pathname = usePathname()
  const { activeFarm, setActiveFarm } = useFarm()

  const currentFarm = activeFarm ?? initialActiveFarm

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Sprout className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {currentFarm?.farm.name ?? "FarmCore"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {currentFarm?.role === "OWNER"
                        ? "Proprietario"
                        : currentFarm?.role === "MANAGER"
                          ? "Gerente"
                          : currentFarm?.role === "ACCOUNTANT"
                            ? "Contador"
                            : currentFarm?.role === "WORKER"
                              ? "Trabalhador"
                              : currentFarm?.role === "VIEWER"
                                ? "Visualizador"
                                : "Selecione uma fazenda"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Fazendas
                </DropdownMenuLabel>
                {farms.map((membership) => (
                  <DropdownMenuItem
                    key={membership.id}
                    onClick={() => setActiveFarm(membership)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <Sprout className="size-4 shrink-0" />
                    </div>
                    <span className="truncate">{membership.farm.name}</span>
                    {membership.id === currentFarm?.id && (
                      <BadgeCheck className="ml-auto size-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navSections.map((section) => (
          <Collapsible key={section.label} defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between">
                  {section.label}
                  <ChevronRight className="size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.title}
                          >
                            <Link href={item.href}>
                              <item.icon className="size-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? "Usuario"} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name ?? "Usuario"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user.image ?? undefined} alt={user.name ?? "Usuario"} />
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user.name ?? "Usuario"}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
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
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

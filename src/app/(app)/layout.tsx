import { redirect } from "next/navigation"
import { requireAuth, getUserFarms, getUserActiveFarm } from "@/lib/permissions"
import { FarmProvider } from "@/providers/farm-provider"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { AppHeader } from "@/components/layout/app-header"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  const farms = await getUserFarms(user.id)

  if (farms.length === 0) {
    redirect("/onboarding")
  }

  const activeFarm = await getUserActiveFarm(user.id)

  return (
    <FarmProvider initialFarms={farms} initialActiveFarm={activeFarm}>
      <SidebarProvider>
        <AppSidebar farms={farms} activeFarm={activeFarm} user={user} />
        <SidebarInset>
          <AppHeader user={user} />
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </FarmProvider>
  )
}

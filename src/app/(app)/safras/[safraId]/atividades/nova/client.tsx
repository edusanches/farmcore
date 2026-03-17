"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { NewActivityWizard } from "@/components/activities/new-activity-wizard"
import { ArrowLeft } from "lucide-react"
import type { NewActivityWizardProps } from "@/components/activities/new-activity-wizard"

interface NovaAtividadeClientProps extends Omit<NewActivityWizardProps, "onSuccess" | "onCancel" | "onNavigateToForm" | "cropId"> {
  safraId: string
  title: string
  subtitle: string
}

export function NovaAtividadeClient({
  safraId,
  title,
  subtitle,
  ...wizardProps
}: NovaAtividadeClientProps) {
  const router = useRouter()

  function handleSuccess() {
    router.push(`/safras/${safraId}/atividades`)
    router.refresh()
  }

  function handleCancel() {
    router.push(`/safras/${safraId}/atividades`)
  }

  // Back arrow: return to the sheet with the type pre-selected at the kind step
  function handleGoBack() {
    const typeId = wizardProps.preselectedType?.id
    const params = new URLSearchParams({ novo: "1" })
    if (typeId) params.set("type", typeId)
    router.push(`/safras/${safraId}/atividades?${params.toString()}`)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleGoBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <NewActivityWizard
        {...wizardProps}
        cropId={safraId}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  )
}

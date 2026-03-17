"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { importNfesFromSefaz } from "@/actions/nfe"
import { useFarm } from "@/providers/farm-provider"
import { Button } from "@/components/ui/button"

export function ImportNfesButton() {
  const [isPending, startTransition] = useTransition()
  const { activeFarm } = useFarm()
  const router = useRouter()

  function handleImport() {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        const result = await importNfesFromSefaz(activeFarm.farmId)
        if (result.importedCount > 0) {
          toast.success(`${result.importedCount} nota(s) fiscal(is) importada(s)`)
        } else {
          toast.info("Nenhuma nota fiscal nova encontrada")
        }
        router.refresh()
      } catch (error: any) {
        toast.error(error?.message || "Erro ao buscar notas fiscais")
      }
    })
  }

  return (
    <Button onClick={handleImport} disabled={isPending}>
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Buscar Notas
    </Button>
  )
}

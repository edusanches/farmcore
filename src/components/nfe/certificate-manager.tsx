"use client"

import { useTransition, useState, useEffect, useRef } from "react"
import { Loader2, ShieldCheck, Trash2, Upload, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import { uploadCertificate, deleteCertificate, getCertificateInfo } from "@/actions/nfe"
import { useFarm } from "@/providers/farm-provider"
import { formatDate } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface CertInfo {
  id: string
  subjectName: string | null
  serialNumber: string | null
  validFrom: Date | null
  validTo: Date | null
  createdAt: Date
}

export function CertificateManager() {
  const [isPending, startTransition] = useTransition()
  const [certInfo, setCertInfo] = useState<CertInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const { activeFarm } = useFarm()

  useEffect(() => {
    if (!activeFarm) return
    setLoading(true)
    getCertificateInfo(activeFarm.farmId)
      .then((info) => setCertInfo(info as CertInfo | null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [activeFarm])

  function handleUpload() {
    if (!activeFarm) return
    const file = fileRef.current?.files?.[0]
    if (!file || !password) {
      toast.error("Selecione o arquivo .pfx e informe a senha")
      return
    }

    const formData = new FormData()
    formData.append("certificate", file)
    formData.append("password", password)

    startTransition(async () => {
      try {
        await uploadCertificate(activeFarm.farmId, formData)
        toast.success("Certificado cadastrado com sucesso")
        setPassword("")
        if (fileRef.current) fileRef.current.value = ""
        const info = await getCertificateInfo(activeFarm.farmId)
        setCertInfo(info as CertInfo | null)
      } catch (error: any) {
        toast.error(error?.message || "Erro ao cadastrar certificado")
      }
    })
  }

  function handleDelete() {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        await deleteCertificate(activeFarm.farmId)
        toast.success("Certificado removido")
        setCertInfo(null)
      } catch {
        toast.error("Erro ao remover certificado")
      }
    })
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const isExpiringSoon =
    certInfo?.validTo &&
    new Date(certInfo.validTo).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000

  const isExpired =
    certInfo?.validTo && new Date(certInfo.validTo) < new Date()

  if (certInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Certificado A1
          </CardTitle>
          <CardDescription>
            Certificado digital para consulta de notas fiscais no SEFAZ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(isExpired || isExpiringSoon) && (
            <div className={`flex items-center gap-2 rounded-lg border p-3 ${
              isExpired
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
            }`}>
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                {isExpired
                  ? "Certificado vencido. Faca o upload de um novo certificado."
                  : "Certificado vence em menos de 30 dias."}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Titular</p>
              <p className="font-medium">{certInfo.subjectName || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Numero de Serie</p>
              <p className="font-medium font-mono text-xs">
                {certInfo.serialNumber || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valido de</p>
              <p className="font-medium">
                {certInfo.validFrom ? formatDate(certInfo.validFrom) : "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valido ate</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  {certInfo.validTo ? formatDate(certInfo.validTo) : "—"}
                </p>
                {isExpired && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                    Vencido
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remover Certificado
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Certificado A1
        </CardTitle>
        <CardDescription>
          Faca o upload do certificado digital A1 (.pfx) para consultar notas
          fiscais no SEFAZ automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Arquivo do Certificado (.pfx)
            </label>
            <Input
              ref={fileRef}
              type="file"
              accept=".pfx,.p12"
              disabled={isPending}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">
              Senha do Certificado
            </label>
            <Input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>

        <Button disabled={isPending} onClick={handleUpload}>
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Enviar Certificado
        </Button>
      </CardContent>
    </Card>
  )
}

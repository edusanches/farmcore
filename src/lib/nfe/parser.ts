import { XMLParser } from "fast-xml-parser"

export interface ParsedNfeItem {
  codigo: string | null
  descricao: string
  ncm: string | null
  cfop: string | null
  unidade: string | null
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

export interface ParsedNfe {
  chaveAcesso: string
  numero: string | null
  serie: string | null
  dataEmissao: string | null
  emitenteCnpj: string | null
  emitenteNome: string | null
  emitenteUf: string | null
  valorTotal: number
  valorProdutos: number
  valorFrete: number
  valorDesconto: number
  items: ParsedNfeItem[]
  xml: string
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  removeNSPrefix: true,
  parseTagValue: true,
  trimValues: true,
})

function toArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}

function str(val: unknown): string | null {
  if (val === undefined || val === null) return null
  return String(val)
}

function num(val: unknown): number {
  if (val === undefined || val === null) return 0
  const n = Number(val)
  return isNaN(n) ? 0 : n
}

export function parseNfeXml(xml: string, chaveAcesso?: string): ParsedNfe {
  const parsed = parser.parse(xml)

  // Navigate to NFe data - handle both nfeProc and NFe root
  const nfeProc = parsed.nfeProc ?? parsed
  const nfe = nfeProc.NFe ?? nfeProc
  const infNFe = nfe.infNFe

  if (!infNFe) {
    // Try resNFe summary format (from MDe distribution)
    const resNFe = parsed.resNFe
    if (resNFe) {
      return {
        chaveAcesso: chaveAcesso || str(resNFe["@_chNFe"]) || "",
        numero: null,
        serie: null,
        dataEmissao: str(resNFe.dhEmi),
        emitenteCnpj: str(resNFe.CNPJ) || str(resNFe.CPF),
        emitenteNome: str(resNFe.xNome),
        emitenteUf: null,
        valorTotal: num(resNFe.vNF),
        valorProdutos: num(resNFe.vNF),
        valorFrete: 0,
        valorDesconto: 0,
        items: [],
        xml,
      }
    }
    throw new Error("Formato de XML de NFe nao reconhecido")
  }

  // Extract chaveAcesso from infNFe Id attribute (e.g. "NFe35...")
  const id = str(infNFe["@_Id"]) || ""
  const key = chaveAcesso || id.replace(/^NFe/, "")

  // Identification
  const ide = infNFe.ide || {}

  // Emitente
  const emit = infNFe.emit || {}
  const emitEnder = emit.enderEmit || {}

  // Totals
  const total = infNFe.total?.ICMSTot || {}

  // Items
  const dets = toArray(infNFe.det)
  const items: ParsedNfeItem[] = dets.map((det: any) => {
    const prod = det.prod || {}
    return {
      codigo: str(prod.cProd),
      descricao: String(prod.xProd || "Sem descricao"),
      ncm: str(prod.NCM),
      cfop: str(prod.CFOP),
      unidade: str(prod.uCom),
      quantidade: num(prod.qCom),
      valorUnitario: num(prod.vUnCom),
      valorTotal: num(prod.vProd),
    }
  })

  return {
    chaveAcesso: key,
    numero: str(ide.nNF),
    serie: str(ide.serie),
    dataEmissao: str(ide.dhEmi) || str(ide.dEmi),
    emitenteCnpj: str(emit.CNPJ) || str(emit.CPF),
    emitenteNome: str(emit.xNome),
    emitenteUf: str(emitEnder.UF),
    valorTotal: num(total.vNF),
    valorProdutos: num(total.vProd),
    valorFrete: num(total.vFrete),
    valorDesconto: num(total.vDesc),
    items,
    xml,
  }
}

export function parseDistDFeResponse(responseXml: string): {
  documents: ParsedNfe[]
  lastNsu: string | null
  cStat: string
  xMotivo: string
} {
  const parsed = parser.parse(responseXml)

  // Navigate through SOAP envelope
  const envelope = parsed["Envelope"] ?? parsed["soap:Envelope"] ?? parsed
  const body = envelope["Body"] ?? envelope["soap:Body"] ?? envelope
  const response =
    body.nfeDistDFeInteresseResponse ?? body.retDistDFeInt ?? body
  const ret = response.retDistDFeInt ?? response

  const cStat = str(ret.cStat) || ""
  const xMotivo = str(ret.xMotivo) || ""
  const lastNsu = str(ret.ultNSU) || str(ret.maxNSU) || null

  if (cStat !== "138") {
    // 138 = documents found, 137 = no new documents
    return { documents: [], lastNsu, cStat, xMotivo }
  }

  const loteDistDFeInt = ret.loteDistDFeInt
  if (!loteDistDFeInt) {
    return { documents: [], lastNsu, cStat, xMotivo }
  }

  const docZips = toArray(loteDistDFeInt.docZip)
  const documents: ParsedNfe[] = []

  for (const docZip of docZips) {
    const schema = str(docZip["@_schema"]) || ""
    const nsu = str(docZip["@_NSU"]) || ""

    // Only process NFe documents (skip events)
    if (!schema.includes("procNFe") && !schema.includes("resNFe")) {
      continue
    }

    try {
      // docZip content is base64-encoded gzipped XML
      const compressed = Buffer.from(String(docZip["#text"] || docZip), "base64")
      const { inflateSync } = require("zlib")
      const xmlContent = inflateSync(compressed).toString("utf-8")

      const nfe = parseNfeXml(xmlContent)
      documents.push(nfe)
    } catch {
      // Skip malformed documents
      continue
    }
  }

  return { documents, lastNsu, cStat, xMotivo }
}

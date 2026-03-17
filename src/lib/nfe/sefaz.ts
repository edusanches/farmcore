import https from "https"
import { prisma } from "@/lib/prisma"
import { decryptData, decryptString } from "./encryption"
import { buildHttpsAgent } from "./certificate"
import { parseDistDFeResponse, type ParsedNfe } from "./parser"

// UF codes for SEFAZ
const UF_CODES: Record<string, string> = {
  AC: "12", AL: "27", AP: "16", AM: "13", BA: "29",
  CE: "23", DF: "53", ES: "32", GO: "52", MA: "21",
  MT: "51", MS: "50", MG: "31", PA: "15", PB: "25",
  PR: "41", PE: "26", PI: "22", RJ: "33", RN: "24",
  RS: "43", RO: "11", RR: "14", SC: "42", SP: "35",
  SE: "28", TO: "17",
}

const SEFAZ_ENDPOINTS = {
  producao: "https://www1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx",
  homologacao: "https://hom1.nfe.fazenda.gov.br/NFeDistribuicaoDFe/NFeDistribuicaoDFe.asmx",
}

function getSefazEnv(): "producao" | "homologacao" {
  return (process.env.NFE_SEFAZ_ENV as any) || "homologacao"
}

function cleanCnpj(doc: string): string {
  return doc.replace(/[.\-\/]/g, "")
}

function buildSoapEnvelope(cnpj: string, ufCode: string, ultNSU: string): string {
  const tpAmb = getSefazEnv() === "producao" ? "1" : "2"

  return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Header>
    <nfeCabecMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
      <cUF>${ufCode}</cUF>
      <versaoDados>1.01</versaoDados>
    </nfeCabecMsg>
  </soap12:Header>
  <soap12:Body>
    <nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
      <nfeDadosMsg>
        <distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
          <tpAmb>${tpAmb}</tpAmb>
          <cUFAutor>${ufCode}</cUFAutor>
          <CNPJ>${cnpj}</CNPJ>
          <distNSU>
            <ultNSU>${ultNSU.padStart(15, "0")}</ultNSU>
          </distNSU>
        </distDFeInt>
      </nfeDadosMsg>
    </nfeDistDFeInteresse>
  </soap12:Body>
</soap12:Envelope>`
}

async function makeSoapRequest(
  url: string,
  soapXml: string,
  agent: https.Agent
): Promise<string> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)

    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: "POST",
      agent,
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
        "Content-Length": Buffer.byteLength(soapXml, "utf-8"),
        SOAPAction:
          "http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse",
      },
    }

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = []
      res.on("data", (chunk) => chunks.push(chunk))
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8")
        if (res.statusCode && res.statusCode >= 400) {
          reject(
            new Error(`SEFAZ retornou status ${res.statusCode}: ${body.slice(0, 200)}`)
          )
        } else {
          resolve(body)
        }
      })
    })

    req.on("error", reject)
    req.write(soapXml)
    req.end()
  })
}

export async function queryDistDFe(farmId: string): Promise<{
  documents: ParsedNfe[]
  lastNsu: string | null
}> {
  // Load farm data and certificate
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    select: { document: true, state: true },
  })

  if (!farm?.document) {
    throw new Error("A fazenda precisa ter um CNPJ cadastrado")
  }

  const cert = await prisma.farmCertificate.findUnique({
    where: { farmId },
  })

  if (!cert) {
    throw new Error("Nenhum certificado digital cadastrado para esta fazenda")
  }

  // Check certificate validity
  if (cert.validTo && cert.validTo < new Date()) {
    throw new Error("O certificado digital esta vencido. Faca o upload de um novo certificado.")
  }

  // Decrypt PFX and password
  const pfxBuffer = decryptData(
    cert.pfxEncrypted,
    cert.pfxIv,
    cert.pfxAuthTag
  )
  const password = decryptString(
    cert.passwordEncrypted,
    cert.passwordIv,
    cert.passwordAuthTag
  )

  // Build HTTPS agent with client certificate
  const agent = buildHttpsAgent(pfxBuffer, password)

  // Determine UF code
  const ufCode = UF_CODES[farm.state?.toUpperCase() || ""] || "35" // default SP
  const cnpj = cleanCnpj(farm.document)

  // Build SOAP request
  const soapXml = buildSoapEnvelope(cnpj, ufCode, cert.lastNsu)

  // Make request to SEFAZ
  const endpoint = SEFAZ_ENDPOINTS[getSefazEnv()]
  const responseXml = await makeSoapRequest(endpoint, soapXml, agent)

  // Parse response
  const result = parseDistDFeResponse(responseXml)

  if (result.cStat === "137") {
    // No new documents
    return { documents: [], lastNsu: result.lastNsu }
  }

  if (result.cStat !== "138") {
    throw new Error(
      `SEFAZ retornou erro ${result.cStat}: ${result.xMotivo}`
    )
  }

  return {
    documents: result.documents,
    lastNsu: result.lastNsu,
  }
}

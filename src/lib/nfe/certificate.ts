import forge from "node-forge"
import https from "https"

export interface CertificateInfo {
  subjectName: string
  serialNumber: string
  validFrom: Date
  validTo: Date
}

export function parsePfx(
  pfxBuffer: Buffer,
  password: string
): CertificateInfo {
  const asn1 = forge.asn1.fromDer(pfxBuffer.toString("binary"))
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password)

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
  const certBag = certBags[forge.pki.oids.certBag]
  if (!certBag || certBag.length === 0) {
    throw new Error("Nenhum certificado encontrado no arquivo PFX")
  }

  const cert = certBag[0].cert
  if (!cert) {
    throw new Error("Certificado inválido no arquivo PFX")
  }

  const subjectName =
    cert.subject.getField("CN")?.value ?? cert.subject.attributes[0]?.value ?? "Desconhecido"
  const serialNumber = cert.serialNumber

  return {
    subjectName: String(subjectName),
    serialNumber,
    validFrom: cert.validity.notBefore,
    validTo: cert.validity.notAfter,
  }
}

export function buildHttpsAgent(
  pfxBuffer: Buffer,
  password: string
): https.Agent {
  return new https.Agent({
    pfx: pfxBuffer,
    passphrase: password,
    rejectUnauthorized: true,
  })
}

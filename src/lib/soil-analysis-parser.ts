import * as XLSX from "xlsx"

export type ParsedSample = {
  sampleId: string
  depth: string
  sampleDate: string // ISO date string
  labName: string
  labReportId?: string
  // macronutrients
  pH?: number
  pHType?: string
  organicMatter?: number
  phosphorus?: number
  potassium?: number
  calcium?: number
  magnesium?: number
  aluminum?: number
  hPlusAl?: number
  // derived
  sumOfBases?: number
  ctc?: number
  baseSaturation?: number
  aluminumSaturation?: number
  // micronutrients
  sulfur?: number
  boron?: number
  copper?: number
  iron?: number
  manganese?: number
  zinc?: number
  // physical
  clayPercent?: number
  siltPercent?: number
  sandPercent?: number
  textureClass?: string
}

export type ParseResult = {
  format: "csv_lagoa_da_serra" | "xls_ciencia_em_solo" | "unknown"
  samples: ParsedSample[]
  errors: string[]
}

function num(v: unknown): number | undefined {
  if (v === null || v === undefined || v === "" || v === "ns") return undefined
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."))
  return isNaN(n) ? undefined : n
}

function parseDate(str: string): string {
  // DD/MM/YYYY → ISO
  const parts = str.trim().split("/")
  if (parts.length === 3) {
    const [d, m, y] = parts
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }
  return str
}

function cleanDepth(raw: string): string {
  // Remove extra quotes: """0-20""" → 0-20
  return raw.replace(/"/g, "").trim()
}

// ─── CSV format (Lab: Lagoa da Serra, 2022) ───────────────────────────────
// AMOSTRA;DATAENTRADA;N° IDENT.;IDENTIFICACAO;N° LAB.;P;M.O.;pH;K;Na;Ca;Mg;H+AL;Si;S;AL;SB;T;V;B;Cu;Fe;Mn;Zn;...
function parseCsvLagoaDaSerra(text: string): ParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  const header = lines[0].split(";").map((h) => h.trim())

  const col = (row: string[], name: string) => {
    const idx = header.indexOf(name)
    return idx >= 0 ? row[idx] : undefined
  }

  const samples: ParsedSample[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(";")
    if (row.length < 5) continue

    const sampleId = col(row, "IDENTIFICACAO")?.trim() ?? `Linha ${i}`
    const dateStr = col(row, "DATAENTRADA") ?? ""
    const depthRaw = col(row, 'N\u00ba IDENT.') ?? col(row, "N° IDENT.") ?? ""
    const depth = cleanDepth(depthRaw) || "0-20"

    try {
      samples.push({
        sampleId,
        depth,
        sampleDate: parseDate(dateStr) || "2022-07-12",
        labName: "",
        labReportId: col(row, "N\u00ba LAB.") ?? col(row, "N\u00b0 LAB."),
        pH: num(col(row, "pH")),
        pHType: "CaCl2",
        organicMatter: num(col(row, "M.O.")),
        phosphorus: num(col(row, "P")),
        potassium: num(col(row, "K")),
        calcium: num(col(row, "Ca")),
        magnesium: num(col(row, "Mg")),
        aluminum: num(col(row, "AL")),
        hPlusAl: num(col(row, "H+AL")),
        sumOfBases: num(col(row, "SB")),
        ctc: num(col(row, "T")),
        baseSaturation: num(col(row, "V")),
        sulfur: num(col(row, "S")),
        boron: num(col(row, "B")),
        copper: num(col(row, "Cu")),
        iron: num(col(row, "Fe")),
        manganese: num(col(row, "Mn")),
        zinc: num(col(row, "Zn")),
        clayPercent: num(col(row, "Argila")),
        siltPercent: num(col(row, "Silte")),
        sandPercent: num(col(row, "Areia Total")),
      })
    } catch (e) {
      errors.push(`Linha ${i + 1}: ${String(e)}`)
    }
  }

  return { format: "csv_lagoa_da_serra", samples, errors }
}

// ─── XLS format (structured lab report, 2024) ────────────────────────────
// Row 0-1: blank, Row 2: headers, Row 3: sub-headers, Row 4+: data
function parseXlsCienciaEmSolo(wb: XLSX.WorkBook): ParseResult {
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  }) as unknown[][]

  let headerRow = -1
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    if (String(rows[i]?.[0] ?? "").includes("Cod")) {
      headerRow = i
      break
    }
  }
  if (headerRow < 0) {
    return { format: "xls_ciencia_em_solo", samples: [], errors: ["Cabeçalho não encontrado"] }
  }

  // Column positions based on known structure
  const C = {
    codLab: 0,
    descricao: 1,
    profundidade: 2,
    laudo: 9,
    pH: 10,
    pResina: 15,
    sSO4: 16,
    k: 18,
    ca: 19,
    mg: 20,
    al: 22,
    hAl: 23,
    mo: 24,
    b: 26,
    cu: 27,
    fe: 28,
    mn: 29,
    zn: 30,
    sb: 31,
    ctc: 32,
    v: 33,
    m: 34,
    argila: 45,
    silte: 46,
    areia: 47,
  }

  const samples: ParsedSample[] = []
  const errors: string[] = []
  const dataStart = headerRow + 2 // skip sub-header row

  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i]
    if (!row || !row[C.codLab]) continue

    const sampleId = String(row[C.descricao] ?? "").trim() || `Amostra ${i}`
    const depth = String(row[C.profundidade] ?? "0-25").trim()
    const codLab = String(row[C.codLab] ?? "").trim()

    try {
      samples.push({
        sampleId,
        depth,
        sampleDate: "2024-08-01",
        labName: "",
        labReportId: String(row[C.laudo] ?? ""),
        pH: num(row[C.pH]),
        pHType: "CaCl2",
        organicMatter: num(row[C.mo]),
        phosphorus: num(row[C.pResina]),
        potassium: num(row[C.k]),
        calcium: num(row[C.ca]),
        magnesium: num(row[C.mg]),
        aluminum: num(row[C.al]),
        hPlusAl: num(row[C.hAl]),
        sumOfBases: num(row[C.sb]),
        ctc: num(row[C.ctc]),
        baseSaturation: num(row[C.v]),
        aluminumSaturation: num(row[C.m]),
        sulfur: num(row[C.sSO4]),
        boron: num(row[C.b]),
        copper: num(row[C.cu]),
        iron: num(row[C.fe]),
        manganese: num(row[C.mn]),
        zinc: num(row[C.zn]),
        clayPercent: num(row[C.argila]),
        siltPercent: num(row[C.silte]),
        sandPercent: num(row[C.areia]),
        // store codLab in sampleId as suffix if different from description
        ...(codLab && codLab !== sampleId ? { sampleId: `${sampleId} (${codLab})` } : {}),
      })
    } catch (e) {
      errors.push(`Linha ${i + 1}: ${String(e)}`)
    }
  }

  return { format: "xls_ciencia_em_solo", samples, errors }
}

// ─── XLSX format (FarmCore normalized export) ─────────────────────────────
// Header row 0: Ano | Amostra | Profundidade | Data Coleta | Cod. Lab | Laudo | pH CaCl2 | ...
function parseXlsFarmCore(wb: XLSX.WorkBook): ParseResult {
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  }) as unknown[][]

  if (rows.length < 2) {
    return { format: "unknown", samples: [], errors: ["Planilha vazia"] }
  }

  const header = (rows[0] as unknown[]).map((h) => String(h ?? "").toLowerCase())
  const col = (name: string) => header.findIndex((h) => h.includes(name))

  const C = {
    amostra: col("amostra"),
    profundidade: col("profundidade"),
    data: col("data"),
    laudo: col("laudo"),
    pH: col("ph"),
    mo: col("m.o"),
    p: col("p ("),
    s: col("s ("),
    k: col("k ("),
    ca: col("ca ("),
    mg: col("mg ("),
    al: col("al ("),
    hAl: col("h+al"),
    sb: col("sb ("),
    ctc: col("ctc ("),
    v: col("v%"),
    m: col("m%"),
    b: col("b ("),
    cu: col("cu ("),
    fe: col("fe ("),
    mn: col("mn ("),
    zn: col("zn ("),
    argila: col("argila"),
    silte: col("silte"),
    areia: col("areia"),
  }

  const samples: ParsedSample[] = []
  const errors: string[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    const amostra = String(row[C.amostra] ?? "").trim()
    if (!amostra) continue

    const depthRaw = String(row[C.profundidade] ?? "0-20").trim()
    const dataRaw = String(row[C.data] ?? "").trim()
    // Accept DD/MM/YYYY or YYYY-MM-DD
    let sampleDate = "2000-01-01"
    if (dataRaw.includes("/")) {
      sampleDate = parseDate(dataRaw)
    } else if (dataRaw.match(/^\d{4}-\d{2}-\d{2}/)) {
      sampleDate = dataRaw.slice(0, 10)
    }

    try {
      samples.push({
        sampleId: amostra,
        depth: depthRaw,
        sampleDate,
        labName: "",
        labReportId: C.laudo >= 0 ? String(row[C.laudo] ?? "").trim() || undefined : undefined,
        pH: num(row[C.pH]),
        pHType: "CaCl2",
        organicMatter: num(row[C.mo]),
        phosphorus: num(row[C.p]),
        potassium: num(row[C.k]),
        calcium: num(row[C.ca]),
        magnesium: num(row[C.mg]),
        aluminum: num(row[C.al]),
        hPlusAl: num(row[C.hAl]),
        sulfur: C.s >= 0 ? num(row[C.s]) : undefined,
        sumOfBases: num(row[C.sb]),
        ctc: num(row[C.ctc]),
        baseSaturation: num(row[C.v]),
        aluminumSaturation: C.m >= 0 ? num(row[C.m]) : undefined,
        boron: C.b >= 0 ? num(row[C.b]) : undefined,
        copper: C.cu >= 0 ? num(row[C.cu]) : undefined,
        iron: C.fe >= 0 ? num(row[C.fe]) : undefined,
        manganese: C.mn >= 0 ? num(row[C.mn]) : undefined,
        zinc: C.zn >= 0 ? num(row[C.zn]) : undefined,
        clayPercent: C.argila >= 0 ? num(row[C.argila]) : undefined,
        siltPercent: C.silte >= 0 ? num(row[C.silte]) : undefined,
        sandPercent: C.areia >= 0 ? num(row[C.areia]) : undefined,
      })
    } catch (e) {
      errors.push(`Linha ${i + 1}: ${String(e)}`)
    }
  }

  return { format: "csv_lagoa_da_serra", samples, errors }
}

// ─── Main entry ───────────────────────────────────────────────────────────
export function parseLabFile(buffer: ArrayBuffer, filename: string): ParseResult {
  const lower = filename.toLowerCase()

  // Try CSV first
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    const text = new TextDecoder("latin1").decode(buffer)
    if (text.includes("IDENTIFICACAO") || text.includes("GRIDE")) {
      return parseCsvLagoaDaSerra(text)
    }
  }

  // Try XLS/XLSX
  if (lower.endsWith(".xls") || lower.endsWith(".xlsx")) {
    try {
      const wb = XLSX.read(new Uint8Array(buffer), { type: "array" })
      const firstSheet = wb.Sheets[wb.SheetNames[0]]
      const text = XLSX.utils.sheet_to_csv(firstSheet)

      // FarmCore normalized format — check first (header-based, unambiguous)
      if (text.toLowerCase().includes("amostra") && text.toLowerCase().includes("profundidade") && text.toLowerCase().includes("ph cacl")) {
        return parseXlsFarmCore(wb)
      }

      if (text.includes("Ciência em Solo") || text.includes("Ciencia em Solo") || text.includes("Cod.Lab") || text.includes("T. P.") || text.includes("T.2")) {
        return parseXlsCienciaEmSolo(wb)
      }

      // fallback: try as CSV
      if (text.includes("IDENTIFICACAO") || text.includes("GRIDE")) {
        return parseCsvLagoaDaSerra(text)
      }
    } catch {
      return { format: "unknown", samples: [], errors: ["Não foi possível ler o arquivo XLS/XLSX"] }
    }
  }

  // Last resort: try to decode as CSV
  try {
    const text = new TextDecoder("latin1").decode(buffer)
    if (text.includes(";")) {
      return parseCsvLagoaDaSerra(text)
    }
  } catch {
    // ignore
  }

  return { format: "unknown", samples: [], errors: ["Formato de arquivo não reconhecido"] }
}

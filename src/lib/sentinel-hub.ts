const TOKEN_URL =
  "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
const STATS_URL = "https://sh.dataspace.copernicus.eu/api/v1/statistics"
const PROCESS_URL = "https://sh.dataspace.copernicus.eu/api/v1/process"
const CATALOG_URL = "https://sh.dataspace.copernicus.eu/api/v1/catalog/1.0.0/search"

const NDVI_IMAGE_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "dataMask"] }],
    output: { bands: 4, sampleType: "AUTO" },
  };
}

function evaluatePixel(sample) {
  if (sample.dataMask === 0) return [0, 0, 0, 0];
  let ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
  // Color ramp: dark red -> red -> orange -> yellow -> light green -> green -> dark green
  if (ndvi < 0.0)  return [0.5, 0.0, 0.0, 0.8];
  if (ndvi < 0.1)  return [0.7, 0.1, 0.1, 0.8];
  if (ndvi < 0.2)  return [0.9, 0.2, 0.1, 0.8];
  if (ndvi < 0.3)  return [0.95, 0.45, 0.1, 0.8];
  if (ndvi < 0.4)  return [0.95, 0.7, 0.1, 0.8];
  if (ndvi < 0.5)  return [0.85, 0.85, 0.1, 0.8];
  if (ndvi < 0.6)  return [0.55, 0.8, 0.15, 0.8];
  if (ndvi < 0.7)  return [0.3, 0.7, 0.15, 0.8];
  if (ndvi < 0.8)  return [0.15, 0.55, 0.1, 0.8];
  return [0.05, 0.4, 0.05, 0.8];
}`

const TRUE_COLOR_EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B03", "B02", "dataMask"] }],
    output: { bands: 4, sampleType: "UINT8" },
  };
}

function clip(x) { return Math.max(0, Math.min(255, x)); }

function adj(c) {
  // Sentinel-2 L2A reflectance is typically 0.0–0.3 for land surfaces.
  // The Copernicus Browser applies offset + gain + gamma to get bright output.
  // offset -0.01 removes atmospheric haze, then scale to [0,1], then gamma.
  var v = (c - 0.01) / 0.35;          // maps 0.01–0.36 reflectance → 0–1
  if (v <= 0) return 0;
  return clip(Math.pow(v, 0.72) * 255); // gamma 0.72
}

function evaluatePixel(sample) {
  if (sample.dataMask === 0) return [0, 0, 0, 0];
  return [adj(sample.B04), adj(sample.B03), adj(sample.B02), 255];
}`

const EVALSCRIPT = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["B04", "B08", "dataMask"] }],
    output: [
      { id: "ndvi", bands: 1 },
      { id: "dataMask", bands: 1 },
    ],
  };
}

function evaluatePixel(sample) {
  const ndvi = (sample.B08 - sample.B04) / (sample.B08 + sample.B04);
  return {
    ndvi: [ndvi],
    dataMask: [sample.dataMask],
  };
}`

// --- Token cache ---

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.token
  }

  const clientId = process.env.SENTINELHUB_CLIENT_ID
  const clientSecret = process.env.SENTINELHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error("SENTINELHUB_CLIENT_ID e SENTINELHUB_CLIENT_SECRET devem estar configurados no .env")
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Falha ao obter token Sentinel Hub: ${res.status} ${text}`)
  }

  const data = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return cachedToken.token
}

// --- GeoJSON helpers ---

function extractGeometry(geojson: unknown): Record<string, unknown> | null {
  if (!geojson || typeof geojson !== "object") return null

  const obj = geojson as Record<string, unknown>

  if (obj.type === "Polygon" || obj.type === "MultiPolygon") {
    return obj
  }

  if (obj.type === "Feature" && obj.geometry) {
    return extractGeometry(obj.geometry)
  }

  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
    for (const feature of obj.features) {
      const geom = extractGeometry(feature)
      if (geom) return geom
    }
  }

  return null
}

// --- NDVI Stats ---

export interface NdviStatEntry {
  date: Date
  mean: number
  min: number
  max: number
  stDev: number | null
  sampleCount: number | null
  noDataCount: number | null
  cloudCoverage: number | null
}

export async function fetchNdviStats(
  geojson: unknown,
  from: Date,
  to: Date,
  maxCloudCover = 40,
): Promise<NdviStatEntry[]> {
  const geometry = extractGeometry(geojson)
  if (!geometry) {
    throw new Error("GeoJSON invalido: nenhum Polygon encontrado")
  }

  // Use Catalog API to find clear days over this specific area
  const days = Math.ceil((to.getTime() - from.getTime()) / 86400000)
  const availableDates = await fetchAvailableDates(geojson, days)
  const clearDates = availableDates.filter((d) => d.cloudCover <= maxCloudCover)

  console.log("[NDVI] Catalog returned", availableDates.length, "dates,", clearDates.length, "clear (<=", maxCloudCover + "%)")
  console.log("[NDVI] Clear dates:", clearDates.map((d) => `${d.date} (${d.cloudCover}%)`))

  if (clearDates.length === 0) return []

  const token = await getAccessToken()
  const allEntries: NdviStatEntry[] = []

  // Build set of approved dates (YYYY-MM-DD) for post-filtering
  const clearDateSet = new Set(clearDates.map((d) => d.date.slice(0, 10)))

  // Group consecutive dates into ranges to minimize API calls
  const dateRanges = groupIntoRanges(clearDates.map((d) => new Date(d.date)))

  for (const range of dateRanges) {
    const body = {
      input: {
        bounds: {
          geometry,
          properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
        },
        data: [
          {
            type: "sentinel-2-l2a",
            dataFilter: {
              timeRange: {
                from: range.from.toISOString(),
                to: range.to.toISOString(),
              },
              maxCloudCoverage: 100,
            },
          },
        ],
      },
      aggregation: {
        timeRange: {
          from: range.from.toISOString(),
          to: range.to.toISOString(),
        },
        aggregationInterval: { of: "P1D" },
        evalscript: EVALSCRIPT,
        width: 512,
        height: 512,
      },
      calculations: {
        default: {},
      },
    }

    const res = await fetch(STATS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Sentinel Hub Statistical API error: ${res.status} ${text}`)
    }

    const result = await res.json()
    allEntries.push(...parseStatsResponse(result))
  }

  // Keep only dates that the Catalog API approved
  return allEntries.filter((e) => clearDateSet.has(e.date.toISOString().slice(0, 10)))
}

function groupIntoRanges(dates: Date[]): Array<{ from: Date; to: Date }> {
  if (dates.length === 0) return []

  // Sort ascending
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime())
  const ranges: Array<{ from: Date; to: Date }> = []

  let rangeStart = sorted[0]
  let rangeEnd = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    const diffDays = (sorted[i].getTime() - rangeEnd.getTime()) / 86400000
    // If gap is 5 days or less, extend the range (cheaper than a new API call)
    if (diffDays <= 5) {
      rangeEnd = sorted[i]
    } else {
      ranges.push({ from: startOfDay(rangeStart), to: endOfDay(rangeEnd) })
      rangeStart = sorted[i]
      rangeEnd = sorted[i]
    }
  }
  ranges.push({ from: startOfDay(rangeStart), to: endOfDay(rangeEnd) })

  return ranges
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date): Date {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() + 1)
  return d
}

function parseStatsResponse(result: Record<string, unknown>): NdviStatEntry[] {
  const entries: NdviStatEntry[] = []
  const data = result.data as Array<Record<string, unknown>> | undefined

  if (!Array.isArray(data)) return entries

  for (const interval of data) {
    const intervalData = interval.interval as Record<string, unknown> | undefined
    const outputs = interval.outputs as Record<string, unknown> | undefined

    if (!intervalData || !outputs) continue

    const ndviOutput = outputs.ndvi as Record<string, unknown> | undefined
    const dataMaskOutput = outputs.dataMask as Record<string, unknown> | undefined

    if (!ndviOutput) continue

    const bands = ndviOutput.bands as Record<string, unknown> | undefined
    const b0 = bands?.B0 as Record<string, unknown> | undefined
    const stats = b0?.stats as Record<string, number> | undefined

    if (!stats) continue

    // Cloud/no-data coverage from dataMask mean (1 = valid, 0 = no-data/cloud)
    // dataMask mean represents the fraction of valid pixels
    let cloudCoverage: number | null = null
    if (dataMaskOutput) {
      const dmBands = dataMaskOutput.bands as Record<string, unknown> | undefined
      const dmB0 = dmBands?.B0 as Record<string, unknown> | undefined
      const dmStats = dmB0?.stats as Record<string, number> | undefined
      if (dmStats && dmStats.mean != null) {
        // mean=1.0 means all pixels valid (0% cloud), mean=0.5 means 50% invalid
        cloudCoverage = (1 - dmStats.mean) * 100
      }
    }

    const dateFrom = (intervalData.from as string) ?? ""

    entries.push({
      date: new Date(dateFrom),
      mean: stats.mean ?? 0,
      min: stats.min ?? 0,
      max: stats.max ?? 0,
      stDev: stats.stDev ?? null,
      sampleCount: stats.sampleCount ?? null,
      noDataCount: stats.noDataCount ?? null,
      cloudCoverage,
    })
  }

  return entries
}

// --- NDVI Image ---

function computeBbox(geojson: unknown): [number, number, number, number] | null {
  const coords: [number, number][] = []
  flattenGeoJsonCoords(geojson, coords)
  if (coords.length === 0) return null

  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity
  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
  }

  // Add small padding
  const padLng = (maxLng - minLng) * 0.05
  const padLat = (maxLat - minLat) * 0.05
  return [minLng - padLng, minLat - padLat, maxLng + padLng, maxLat + padLat]
}

function flattenGeoJsonCoords(obj: unknown, out: [number, number][]): void {
  if (!obj || typeof obj !== "object") return
  const o = obj as Record<string, unknown>

  if (o.type === "FeatureCollection" && Array.isArray(o.features)) {
    for (const f of o.features) flattenGeoJsonCoords(f, out)
    return
  }
  if (o.type === "Feature" && o.geometry) {
    flattenGeoJsonCoords(o.geometry, out)
    return
  }
  if (Array.isArray(o.coordinates)) {
    flattenNumCoords(o.coordinates as unknown[], out)
  }
}

function flattenNumCoords(arr: unknown[], out: [number, number][]): void {
  if (arr.length >= 2 && typeof arr[0] === "number" && typeof arr[1] === "number") {
    out.push([arr[0] as number, arr[1] as number]) // [lng, lat]
    return
  }
  for (const item of arr) {
    if (Array.isArray(item)) flattenNumCoords(item, out)
  }
}

export type SatelliteImageMode = "ndvi" | "truecolor"

export interface SatelliteImageResult {
  image: Buffer
  bbox: [number, number, number, number] // [minLng, minLat, maxLng, maxLat]
}

/** @deprecated Use fetchSatelliteImage instead */
export async function fetchNdviImage(
  geojson: unknown,
  date?: Date,
): Promise<SatelliteImageResult> {
  return fetchSatelliteImage(geojson, "ndvi", date)
}

/**
 * Compute image dimensions from bbox targeting ~5m/pixel (2x Sentinel-2 native).
 * The API resamples with bilinear interpolation, producing smoother output.
 * Caps at MAX_PX to avoid huge API responses.
 */
function computeImageSize(bbox: [number, number, number, number]): { width: number; height: number } {
  const MAX_PX = 2500
  const MIN_PX = 512

  const [minLng, minLat, maxLng, maxLat] = bbox
  const midLat = (minLat + maxLat) / 2

  // Approximate meters per degree at this latitude
  const metersPerDegLat = 111_320
  const metersPerDegLng = 111_320 * Math.cos((midLat * Math.PI) / 180)

  const widthMeters = (maxLng - minLng) * metersPerDegLng
  const heightMeters = (maxLat - minLat) * metersPerDegLat

  // Target ~5m/pixel (2x native) for smoother rendering
  const targetRes = 5
  let width = Math.round(widthMeters / targetRes)
  let height = Math.round(heightMeters / targetRes)

  // Clamp to valid range
  width = Math.max(MIN_PX, Math.min(MAX_PX, width))
  height = Math.max(MIN_PX, Math.min(MAX_PX, height))

  return { width, height }
}

export async function fetchSatelliteImage(
  geojson: unknown,
  mode: SatelliteImageMode = "ndvi",
  date?: Date,
): Promise<SatelliteImageResult> {
  const geometry = extractGeometry(geojson)
  if (!geometry) throw new Error("GeoJSON invalido: nenhum Polygon encontrado")

  const bbox = computeBbox(geometry)
  if (!bbox) throw new Error("Nao foi possivel calcular o bounding box")

  const token = await getAccessToken()
  const { width, height } = computeImageSize(bbox)

  let from: Date
  let to: Date
  let mosaickingOrder: string | undefined

  if (date) {
    // Specific date: 1-day range (start of day to end of day UTC)
    from = new Date(date)
    from.setUTCHours(0, 0, 0, 0)
    to = new Date(date)
    to.setUTCHours(23, 59, 59, 999)
  } else {
    // No date: 30-day mosaic with leastCC
    to = new Date()
    from = new Date(to)
    from.setDate(from.getDate() - 30)
    mosaickingOrder = "leastCC"
  }

  const dataFilter: Record<string, unknown> = {
    timeRange: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
    maxCloudCoverage: date ? 100 : 30,
  }
  if (mosaickingOrder) {
    dataFilter.mosaickingOrder = mosaickingOrder
  }

  const body = {
    input: {
      bounds: {
        bbox,
        properties: { crs: "http://www.opengis.net/def/crs/EPSG/0/4326" },
      },
      data: [
        {
          type: "sentinel-2-l2a",
          dataFilter,
          processing: { upsampling: "BICUBIC" },
        },
      ],
    },
    output: {
      width,
      height,
      responses: [{ identifier: "default", format: { type: "image/png" } }],
    },
    evalscript: mode === "truecolor" ? TRUE_COLOR_EVALSCRIPT : NDVI_IMAGE_EVALSCRIPT,
  }

  const res = await fetch(PROCESS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "image/png",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Sentinel Hub Process API error: ${res.status} ${text}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  return {
    image: Buffer.from(arrayBuffer),
    bbox,
  }
}

// --- Available Dates (Catalog API) ---

export interface AvailableDateEntry {
  date: string
  cloudCover: number
}

export async function fetchAvailableDates(
  geojson: unknown,
  days: number = 90,
): Promise<AvailableDateEntry[]> {
  const geometry = extractGeometry(geojson)
  if (!geometry) throw new Error("GeoJSON invalido: nenhum Polygon encontrado")

  const token = await getAccessToken()

  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - days)

  const body = {
    collections: ["sentinel-2-l2a"],
    datetime: `${from.toISOString()}/${to.toISOString()}`,
    intersects: geometry,
    limit: 100,
    fields: {
      include: ["properties.datetime", "properties.eo:cloud_cover"],
    },
  }

  const res = await fetch(CATALOG_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/geo+json",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Sentinel Hub Catalog API error: ${res.status} ${text}`)
  }

  const result = await res.json()
  const features = result.features as Array<{
    properties: { datetime: string; "eo:cloud_cover"?: number }
  }> | undefined

  if (!Array.isArray(features)) return []

  const entries: AvailableDateEntry[] = features.map((f) => ({
    date: f.properties.datetime,
    cloudCover: f.properties["eo:cloud_cover"] ?? 0,
  }))

  // Sort by date descending
  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return entries
}

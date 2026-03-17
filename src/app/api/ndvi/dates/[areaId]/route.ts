import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { fetchAvailableDates } from "@/lib/sentinel-hub"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ areaId: string }> }
) {
  try {
    const { areaId } = await params
    const user = await requireAuth()
    const membership = await getUserActiveFarm(user.id)
    if (!membership) {
      return NextResponse.json({ error: "Sem acesso" }, { status: 403 })
    }

    const area = await prisma.area.findFirst({
      where: { id: areaId, farmId: membership.farmId, active: true },
      select: { geojson: true },
    })

    if (!area || !area.geojson) {
      return NextResponse.json({ error: "Area sem geometria" }, { status: 404 })
    }

    const dates = await fetchAvailableDates(area.geojson)

    return NextResponse.json(dates, {
      headers: {
        "Cache-Control": "public, max-age=3600", // Cache 1h
      },
    })
  } catch (err) {
    console.error("NDVI dates error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao buscar datas NDVI" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const farmId = req.nextUrl.searchParams.get("farmId")
  if (!farmId) {
    return NextResponse.json([], { status: 400 })
  }

  const cropId = req.nextUrl.searchParams.get("cropId")
  const kind = req.nextUrl.searchParams.get("kind")

  const activities = await prisma.activity.findMany({
    where: {
      farmId,
      ...(cropId && { cropId }),
      ...(kind && { kind: kind as any }),
    },
    include: {
      activityType: { select: { name: true, color: true, icon: true } },
      crop: { select: { name: true } },
      activityAreas: {
        include: { area: { select: { name: true } } },
      },
      inputUsages: {
        include: { input: { select: { name: true, unit: true } } },
      },
    },
    orderBy: { startDate: "desc" },
  })

  const mapped = activities.map((a) => ({
    id: a.id,
    code: a.code,
    type: a.activityType.name,
    subtype: a.subtype,
    crop: a.crop,
    startDate: a.startDate?.toISOString() ?? null,
    endDate: a.endDate?.toISOString() ?? null,
    areas: a.activityAreas.map((aa) => ({ name: aa.area.name })),
    status: a.status,
    kind: a.kind,
    totalHa: a.totalHa,
    inputUsages: a.inputUsages.map((u) => ({
      inputName: u.input.name,
      quantity: u.quantity,
      unit: u.input.unit,
    })),
  }))

  return NextResponse.json(mapped)
}

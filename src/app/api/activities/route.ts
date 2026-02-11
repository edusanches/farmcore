import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const farmId = req.nextUrl.searchParams.get("farmId")
  if (!farmId) {
    return NextResponse.json([], { status: 400 })
  }

  const activities = await prisma.activity.findMany({
    where: { farmId },
    include: {
      activityType: { select: { name: true } },
      crop: { select: { name: true } },
      activityAreas: {
        include: { area: { select: { name: true } } },
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
  }))

  return NextResponse.json(mapped)
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const farmId = req.nextUrl.searchParams.get("farmId")
  if (!farmId) {
    return NextResponse.json([], { status: 400 })
  }

  const areas = await prisma.area.findMany({
    where: { farmId, active: true },
    select: { id: true, name: true, sizeHa: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(areas)
}

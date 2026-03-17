import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const farmId = req.nextUrl.searchParams.get("farmId")
  if (!farmId) {
    return NextResponse.json([], { status: 400 })
  }

  const crops = await prisma.crop.findMany({
    where: { farmId },
    select: { id: true, name: true, status: true },
    orderBy: { startDate: "desc" },
  })

  return NextResponse.json(crops)
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const farmId = req.nextUrl.searchParams.get("farmId")
  if (!farmId) {
    return NextResponse.json([], { status: 400 })
  }

  const cropAreas = await prisma.cropArea.findMany({
    where: {
      cropId: id,
      crop: { farmId },
    },
    include: {
      area: { select: { id: true, name: true, sizeHa: true } },
    },
  })

  const areas = cropAreas.map((ca) => ca.area)

  return NextResponse.json(areas)
}

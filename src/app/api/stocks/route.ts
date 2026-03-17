import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const farmId = req.nextUrl.searchParams.get("farmId")
  const type = req.nextUrl.searchParams.get("type")
  if (!farmId) {
    return NextResponse.json([], { status: 400 })
  }

  const stocks = await prisma.stock.findMany({
    where: {
      farmId,
      active: true,
      ...(type ? { type: type as any } : {}),
    },
    select: { id: true, name: true, type: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(stocks)
}

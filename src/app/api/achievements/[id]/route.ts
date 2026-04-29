import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const achievement = await db.achievement.update({
      where: { id },
      data: { unlockedAt: body.unlockedAt || new Date().toISOString() },
    })

    return NextResponse.json(achievement)
  } catch (error) {
    console.error("Failed to update achievement:", error)
    return NextResponse.json({ error: "Failed to update achievement" }, { status: 500 })
  }
}

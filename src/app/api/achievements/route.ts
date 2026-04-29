import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ACHIEVEMENT_DEFS } from "@/lib/achievements"

// GET /api/achievements - fetch all achievements, seed if empty
export async function GET() {
  try {
    let achievements = await db.achievement.findMany({
      orderBy: [{ tier: "asc" }, { createdAt: "asc" }],
    })

    // Seed achievements if none exist
    if (achievements.length === 0) {
      const seedData = ACHIEVEMENT_DEFS.map((def) => ({
        key: def.key,
        title: def.title,
        description: def.description,
        icon: def.icon,
        tier: def.tier,
      }))

      await db.achievement.createMany({
        data: seedData,
      })

      achievements = await db.achievement.findMany({
        orderBy: [{ tier: "asc" }, { createdAt: "asc" }],
      })
    }

    return NextResponse.json(achievements)
  } catch (error) {
    console.error("Failed to fetch achievements:", error)
    return NextResponse.json({ error: "Failed to fetch achievements" }, { status: 500 })
  }
}

// POST /api/achievements - check and unlock achievements based on state
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { achievementState } = body as { achievementState: Record<string, number> }

    if (!achievementState) {
      return NextResponse.json({ error: "achievementState is required" }, { status: 400 })
    }

    const achievements = await db.achievement.findMany()
    const unlockedKeys = new Set(
      achievements.filter((a) => a.unlockedAt).map((a) => a.key)
    )

    const newlyUnlocked: string[] = []

    for (const def of ACHIEVEMENT_DEFS) {
      if (!unlockedKeys.has(def.key) && def.condition(achievementState as never)) {
        const existing = achievements.find((a) => a.key === def.key)
        if (existing) {
          await db.achievement.update({
            where: { id: existing.id },
            data: { unlockedAt: new Date().toISOString() },
          })
          newlyUnlocked.push(def.key)
        }
      }
    }

    const updatedAchievements = await db.achievement.findMany({
      orderBy: [{ tier: "asc" }, { createdAt: "asc" }],
    })

    return NextResponse.json({
      achievements: updatedAchievements,
      newlyUnlocked,
    })
  } catch (error) {
    console.error("Failed to process achievements:", error)
    return NextResponse.json({ error: "Failed to process achievements" }, { status: 500 })
  }
}

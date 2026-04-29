"use client"

import { useEffect, useRef } from "react"
import { useAppStore, type Achievement } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Lock, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

const tierConfig: Record<string, { label: string; labelAr: string; color: string; bg: string; border: string; glow: string }> = {
  bronze: {
    label: "Bronze",
    labelAr: "برونزي",
    color: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-300 dark:border-amber-700/50",
    glow: "shadow-amber-500/20",
  },
  silver: {
    label: "Silver",
    labelAr: "فضي",
    color: "text-slate-600 dark:text-slate-300",
    bg: "bg-slate-100 dark:bg-slate-800/40",
    border: "border-slate-300 dark:border-slate-600/50",
    glow: "shadow-slate-400/20",
  },
  gold: {
    label: "Gold",
    labelAr: "ذهبي",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    border: "border-yellow-300 dark:border-yellow-700/50",
    glow: "shadow-yellow-500/20",
  },
}

function formatUnlockDate(dateStr: string, lang: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export function AchievementsView() {
  const { achievements, settings, checkAndUnlockAchievements } = useAppStore()
  const lang = settings.language
  const checkedRef = useRef(false)

  useEffect(() => {
    if (!checkedRef.current && achievements.length > 0) {
      checkedRef.current = true
      checkAndUnlockAchievements()
    }
  }, [achievements.length, checkAndUnlockAchievements])

  const unlockedCount = achievements.filter((a) => a.unlockedAt).length
  const totalCount = achievements.length
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

  const tierOrder = ["bronze", "silver", "gold"]
  const sortedAchievements = [...achievements].sort((a, b) => {
    const tierA = tierOrder.indexOf(a.tier)
    const tierB = tierOrder.indexOf(b.tier)
    if (tierA !== tierB) return tierA - tierB
    if (a.unlockedAt && !b.unlockedAt) return -1
    if (!a.unlockedAt && b.unlockedAt) return 1
    return 0
  })

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/50 bg-card/80 p-6 backdrop-blur-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
              <Trophy className="size-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-foreground">
                {t("achievementsView", lang)}
              </h2>
              <p className="text-sm text-muted-foreground">
                {unlockedCount} {t("unlocked", lang)} / {totalCount}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {progressPercent}%
            </span>
          </div>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {tierOrder.map((tier) => {
            const config = tierConfig[tier]
            if (!config) return null
            const tierAchievements = achievements.filter((a) => a.tier === tier)
            const tierUnlocked = tierAchievements.filter((a) => a.unlockedAt).length
            return (
              <div
                key={tier}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-1.5",
                  config.bg,
                  config.border
                )}
              >
                <span className={cn("text-xs font-bold", config.color)}>
                  {lang === "ar" ? config.labelAr : config.label}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {tierUnlocked}/{tierAchievements.length}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedAchievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            lang={lang}
          />
        ))}
      </div>

      {achievements.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted/50">
            <Trophy className="size-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {t("achievementsView", lang)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Complete tasks, create notes, and build habits to unlock achievements
          </p>
        </div>
      )}
    </div>
  )
}

function AchievementCard({
  achievement,
  lang,
}: {
  achievement: Achievement
  lang: string
}) {
  const isUnlocked = !!achievement.unlockedAt
  const config = tierConfig[achievement.tier] || tierConfig.bronze

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition-all duration-300",
        isUnlocked
          ? cn(
              "border-border/50 bg-card/80 backdrop-blur-sm hover:-translate-y-0.5 hover:shadow-lg",
              config.glow
            )
          : "border-border/30 bg-muted/30 opacity-60 grayscale hover:opacity-80 hover:grayscale-[50%]"
      )}
    >
      <div
        className={cn(
          "h-1.5 w-full",
          isUnlocked
            ? achievement.tier === "gold"
              ? "bg-gradient-to-r from-yellow-400 to-amber-500"
              : achievement.tier === "silver"
                ? "bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-500 dark:to-slate-600"
                : "bg-gradient-to-r from-amber-400 to-amber-600"
            : "bg-muted"
        )}
      />

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex size-12 items-center justify-center rounded-xl text-2xl",
              isUnlocked ? config.bg : "bg-muted/50"
            )}
          >
            {isUnlocked ? achievement.icon : <Lock className="size-5 text-muted-foreground" />}
          </div>
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-bold",
              isUnlocked
                ? cn(config.color, config.border, config.bg)
                : "text-muted-foreground border-border"
            )}
          >
            {lang === "ar" ? config.labelAr : config.label}
          </Badge>
        </div>

        <div className="mt-3">
          <h3
            className={cn(
              "text-sm font-bold",
              isUnlocked ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {isUnlocked ? achievement.title : "???"}
          </h3>
          <p
            className={cn(
              "mt-1 text-xs leading-relaxed",
              isUnlocked ? "text-muted-foreground" : "text-muted-foreground/60"
            )}
          >
            {achievement.description}
          </p>
        </div>

        {isUnlocked && achievement.unlockedAt && (
          <div className="mt-3 flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
              {t("unlocked", lang)} {formatUnlockDate(achievement.unlockedAt, lang)}
            </span>
          </div>
        )}

        {!isUnlocked && (
          <div className="mt-3 flex items-center gap-1.5">
            <Lock className="size-3 text-muted-foreground/50" />
            <span className="text-[10px] font-medium text-muted-foreground/50">
              {t("locked", lang)}
            </span>
          </div>
        )}
      </div>

      {isUnlocked && (
        <div
          className={cn(
            "pointer-events-none absolute -right-8 -top-8 size-24 rounded-full opacity-20 blur-2xl",
            achievement.tier === "gold"
              ? "bg-yellow-400"
              : achievement.tier === "silver"
                ? "bg-slate-300"
                : "bg-amber-400"
          )}
        />
      )}
    </div>
  )
}

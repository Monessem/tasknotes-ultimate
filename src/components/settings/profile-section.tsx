"use client"

import { useMemo } from "react"
import {
  Timer,
  CheckSquare,
  Target,
  User,
  Clock,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { sectionClass, getInitials, formatDate, type UpdateSettingsFn, type Lang } from "./settings-shared"

interface ProfileSectionProps {
  settings: ReturnType<typeof useAppStore>["settings"]
  updateSettings: UpdateSettingsFn
  lang: Lang
}

export function ProfileSection({ settings, updateSettings, lang }: ProfileSectionProps) {
  const { todos, notes, habits, habitLogs, pomodoroSessions, historyEntries } = useAppStore()

  const profileStats = useMemo(() => {
    const completedTasks = todos.filter((t) => t.completed && !t.deletedAt).length
    const totalFocusMinutes = pomodoroSessions
      .filter((s) => s.type === "work")
      .reduce((acc, s) => acc + s.duration, 0)

    // Calculate best habit streak
    let bestStreak = 0
    for (const habit of habits) {
      if (habit.deletedAt) continue
      const logs = habitLogs
        .filter((l) => l.habitId === habit.id && l.completed)
        .map((l) => l.date)
        .sort()
      let currentStreak = 0
      let maxStreak = 0
      let prevDate: Date | null = null
      for (const dateStr of logs) {
        const d = new Date(dateStr)
        if (prevDate) {
          const diff = (d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
          if (Math.abs(diff - 1) < 0.5) {
            currentStreak++
          } else {
            currentStreak = 1
          }
        } else {
          currentStreak = 1
        }
        maxStreak = Math.max(maxStreak, currentStreak)
        prevDate = d
      }
      bestStreak = Math.max(bestStreak, maxStreak)
    }

    // Member since - earliest history entry or earliest todo
    const dates = [
      ...historyEntries.map((e) => new Date(e.createdAt).getTime()),
      ...todos.map((t) => new Date(t.createdAt).getTime()),
      ...notes.map((n) => new Date(n.createdAt).getTime()),
    ].filter((d) => !isNaN(d))
    const memberSince = dates.length > 0 ? new Date(Math.min(...dates)) : new Date()

    return {
      completedTasks,
      focusHours: Math.round(totalFocusMinutes / 60),
      bestStreak,
      memberSince,
    }
  }, [todos, notes, habits, habitLogs, pomodoroSessions, historyEntries])

  return (
    <Card className={sectionClass}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-base">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40">
            <User className="size-4.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          {t("profile", lang)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Avatar + Name */}
        <div className="flex items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-2xl font-bold text-white shadow-lg shadow-emerald-500/25">
            {getInitials(settings.displayName)}
          </div>
          <div className="flex-1 space-y-1.5">
            <Input
              value={settings.displayName}
              onChange={(e) => updateSettings({ displayName: e.target.value })}
              placeholder={t("displayNamePlaceholder", lang)}
              className="h-9 rounded-xl border-border/50 bg-background/50 text-sm"
            />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>{t("memberSince", lang)} {formatDate(profileStats.memberSince, lang)}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border/30 bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
            <CheckSquare className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{profileStats.completedTasks}</span>
            <span className="text-[10px] text-muted-foreground">{t("tasksCompletedStat", lang)}</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border/30 bg-amber-50/50 p-3 dark:bg-amber-950/20">
            <Target className="size-4 text-amber-600 dark:text-amber-400" />
            <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{profileStats.bestStreak}</span>
            <span className="text-[10px] text-muted-foreground">{t("habitsStreakStat", lang)}</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border/30 bg-cyan-50/50 p-3 dark:bg-cyan-950/20">
            <Timer className="size-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-lg font-bold text-cyan-700 dark:text-cyan-300">{profileStats.focusHours}</span>
            <span className="text-[10px] text-muted-foreground">{t("focusHoursStat", lang)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

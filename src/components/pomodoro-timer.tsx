"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Play, Pause, RotateCcw, Timer, Flame, Zap } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { audioManager } from "@/lib/audio"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type PomodoroMode = "work" | "shortBreak" | "longBreak"

const modeDurations: Record<PomodoroMode, (work: number, short: number, long: number) => number> = {
  work: (w) => w,
  shortBreak: (_w, s) => s,
  longBreak: (_w, _s, l) => l,
}

export function PomodoroTimer() {
  const { settings, pomodoroSessions, setPomodoroSessions } = useAppStore()
  const lang = settings.language

  const [mode, setMode] = useState<PomodoroMode>("work")
  const [timeLeft, setTimeLeft] = useState(settings.pomodoroWork * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [endTime, setEndTime] = useState<number | null>(null)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getDuration = useCallback(
    (m: PomodoroMode) => {
      return modeDurations[m](settings.pomodoroWork, settings.pomodoroShortBreak, settings.pomodoroLongBreak) * 60
    },
    [settings.pomodoroWork, settings.pomodoroShortBreak, settings.pomodoroLongBreak]
  )

  // Timer tick
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          audioManager.play("timer")
          setIsRunning(false)
          // Record session if it was a work session
          if (mode === "work") {
            const todayStr = new Date().toISOString().split("T")[0]
            const newSession = {
              id: crypto.randomUUID(),
              date: todayStr,
              duration: settings.pomodoroWork,
              type: "work" as const,
            }
            setPomodoroSessions([...pomodoroSessions, newSession])
            // Persist to API
            fetch("/api/pomodoro", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ date: todayStr, duration: settings.pomodoroWork, type: "work" }),
            }).catch(() => {
              // Silently fail - local state is still updated
            })
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, mode, settings.pomodoroWork, pomodoroSessions, setPomodoroSessions])

  // Handle visibility change for background timer
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible" && endTime && isRunning) {
        const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000))
        setTimeLeft(remaining)
        if (remaining <= 0) {
          setIsRunning(false)
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
  }, [endTime, isRunning])

  const handleModeChange = useCallback(
    (newMode: PomodoroMode) => {
      setIsRunning(false)
      setMode(newMode)
      setTimeLeft(getDuration(newMode))
      setEndTime(null)
    },
    [getDuration]
  )

  const handlePlayPause = useCallback(() => {
    setIsRunning((prev) => {
      if (!prev) {
        // Starting: calculate endTime from current timeLeft
        setEndTime(Date.now() + timeLeft * 1000)
      } else {
        // Pausing: clear endTime
        setEndTime(null)
      }
      return !prev
    })
  }, [timeLeft])

  const handleReset = useCallback(() => {
    setIsRunning(false)
    setTimeLeft(getDuration(mode))
    setEndTime(null)
  }, [getDuration, mode])

  const totalSeconds = getDuration(mode)
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  // Stats
  const todayStr = new Date().toISOString().split("T")[0]
  const todaySessions = pomodoroSessions.filter((s) => s.date === todayStr && s.type === "work").length
  const focusMinutes = pomodoroSessions
    .filter((s) => s.date === todayStr && s.type === "work")
    .reduce((acc, s) => acc + s.duration, 0)

  // Calculate streak
  const streakDays = calculatePomodoroStreak(pomodoroSessions)

  const modeConfig: { key: PomodoroMode; labelKey: string }[] = [
    { key: "work", labelKey: "work" },
    { key: "shortBreak", labelKey: "shortBreak" },
    { key: "longBreak", labelKey: "longBreak" },
  ]

  // Gradient color based on mode
  const gradientColors = {
    work: "from-emerald-500 to-teal-600",
    shortBreak: "from-cyan-400 to-teal-500",
    longBreak: "from-amber-400 to-orange-500",
  }

  const ringGradient = {
    work: "#10b981",
    shortBreak: "#22d3ee",
    longBreak: "#f59e0b",
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm">
      <h3 className="mb-4 text-base font-bold text-foreground">
        {t("pomodoroTimer", lang)}
      </h3>

      <div className="flex flex-col items-center">
        {/* Circular timer */}
        <div className="relative mb-5">
          <svg className="size-40 -rotate-90" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted/30"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke={ringGradient[mode]}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 70}`}
              strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress / 100)}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          {/* Inner circle background */}
          <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-card shadow-inner">
            <span
              className={cn(
                "font-mono text-3xl font-extrabold tabular-nums bg-gradient-to-br bg-clip-text text-transparent",
                gradientColors[mode]
              )}
            >
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground">
              {mode === "work"
                ? t("workTime", lang)
                : mode === "shortBreak"
                  ? t("shortBreak", lang)
                  : t("longBreak", lang)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-4 flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="size-12 rounded-full"
            onClick={handleReset}
            aria-label="Reset timer"
          >
            <RotateCcw className="size-5" />
          </Button>
          <Button
            size="icon"
            className={cn(
              "size-14 rounded-full shadow-lg transition-all",
              isRunning
                ? "bg-gradient-to-r from-amber-500 to-orange-500 shadow-amber-500/30 hover:from-amber-600 hover:to-orange-600"
                : "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-700"
            )}
            onClick={handlePlayPause}
            aria-label={isRunning ? "Pause timer" : "Start timer"}
          >
            {isRunning ? (
              <Pause className="size-6 text-white" />
            ) : (
              <Play className="size-6 text-white" />
            )}
          </Button>
        </div>

        {/* Mode selector */}
        <div className="flex gap-2">
          {modeConfig.map((m) => (
            <button
              key={m.key}
              onClick={() => handleModeChange(m.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                mode === m.key
                  ? `bg-gradient-to-r ${gradientColors[m.key]} text-white shadow-md`
                  : "border border-border/50 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
            >
              {t(m.labelKey, lang)}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-5 grid w-full grid-cols-3 gap-3 border-t border-border/30 pt-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Timer className="size-3 text-emerald-500" />
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {todaySessions}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {t("todaySessions", lang)}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Zap className="size-3 text-teal-500" />
              <span className="text-lg font-bold text-teal-600 dark:text-teal-400">
                {focusMinutes}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {t("focusMinutes", lang)}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Flame className="size-3 text-amber-500" />
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {streakDays}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {t("consecutiveDays", lang)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function calculatePomodoroStreak(sessions: { date: string; type: string }[]): number {
  const workDays = new Set(
    sessions.filter((s) => s.type === "work").map((s) => s.date)
  )

  if (workDays.size === 0) return 0

  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    if (workDays.has(dateStr)) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  return streak
}

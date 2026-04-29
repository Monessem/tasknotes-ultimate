"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Zap,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  SkipForward,
  Clock,
  Flame,
  Trophy,
  PartyPopper,
} from "lucide-react"
import { useAppStore, type Todo } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { audioManager } from "@/lib/audio"
import { logHistory } from "@/lib/history-log"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"

// Timer presets in minutes
const TIMER_PRESETS = [5, 15, 25] as const

function getPriorityColor(priority: Todo["priority"]) {
  switch (priority) {
    case "high":
      return "bg-rose-500"
    case "medium":
      return "bg-amber-500"
    case "low":
      return "bg-emerald-500"
    default:
      return "bg-amber-500"
  }
}

function getPriorityBorderColor(priority: Todo["priority"]) {
  switch (priority) {
    case "high":
      return "border-rose-500/40"
    case "medium":
      return "border-amber-500/40"
    case "low":
      return "border-emerald-500/40"
    default:
      return "border-amber-500/40"
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export function FocusView() {
  const { todos, fetchTodos, settings, checkAndUnlockAchievements } = useAppStore()
  const lang = settings.language

  // Focus queue state
  const [rawIndex, setRawIndex] = useState(0)
  const [sessionCompleted, setSessionCompleted] = useState(0)
  const [sessionTimeSeconds, setSessionTimeSeconds] = useState(0)
  const [streak, setStreak] = useState(0)

  // Timer state
  const [timerDuration, setTimerDuration] = useState<number>(25 * 60) // seconds
  const [timerRemaining, setTimerRemaining] = useState<number>(25 * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [activePreset, setActivePreset] = useState<number>(2) // index into TIMER_PRESETS, default 25m
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Subtask toggle local state (optimistic)
  const [localSubtasks, setLocalSubtasks] = useState<Record<string, { id: string; title: string; completed: boolean }[]>>({})

  // Get active (incomplete, non-deleted) tasks
  const focusTasks = todos.filter((task) => !task.completed && !task.deletedAt)

  // Ensure currentIndex is within bounds using derived value (no setState in effect)
  const currentIndex = useMemo(
    () => (focusTasks.length > 0 && rawIndex >= focusTasks.length ? 0 : rawIndex),
    [rawIndex, focusTasks.length]
  )

  const currentTask = focusTasks[currentIndex] || null
  const nextTasks = focusTasks.slice(currentIndex + 1, currentIndex + 3)

  // Get subtasks for current task (use local state if available)
  const currentSubtasks = currentTask
    ? localSubtasks[currentTask.id] || currentTask.subtasks
    : []

  // Timer logic
  useEffect(() => {
    if (timerRunning && timerRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerRemaining((prev) => {
          if (prev <= 1) {
            setTimerRunning(false)
            audioManager.play("timer")
            toast.success(lang === "ar" ? "انتهى الوقت!" : "Time's up!", {
              description: lang === "ar" ? "حان وقت الاستراحة" : "Time for a break",
            })
            return 0
          }
          return prev - 1
        })
        setSessionTimeSeconds((prev) => prev + 1)
      }, 1000)
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [timerRunning, timerRemaining, lang])

  function handleTimerPreset(presetIndex: number) {
    const minutes = TIMER_PRESETS[presetIndex]
    const seconds = minutes * 60
    setActivePreset(presetIndex)
    setTimerDuration(seconds)
    setTimerRemaining(seconds)
    setTimerRunning(false)
  }

  function handleTimerToggle() {
    if (timerRemaining <= 0) {
      setTimerRemaining(timerDuration)
    }
    setTimerRunning((prev) => !prev)
  }

  function handleTimerReset() {
    setTimerRunning(false)
    setTimerRemaining(timerDuration)
  }

  async function handleCompleteTask() {
    if (!currentTask) return

    try {
      const res = await fetch(`/api/todos/${currentTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true, completedAt: new Date().toISOString() }),
      })
      if (res.ok) {
        audioManager.play("complete")
        logHistory("complete", "task", currentTask.id, currentTask.title)
        toast.success(t("taskCompleted", lang))
        setSessionCompleted((prev) => prev + 1)
        setStreak((prev) => prev + 1)
        fetchTodos()
        checkAndUnlockAchievements()
        if (currentIndex >= focusTasks.length - 1) {
          setRawIndex(0)
        }
      }
    } catch (err) {
      console.error("Failed to complete task in focus view:", err)
    }
  }

  function handleSkipTask() {
    audioManager.play("click")
    setStreak(0)
    if (currentIndex < focusTasks.length - 1) {
      setRawIndex((prev) => prev + 1)
    } else {
      setRawIndex(0)
    }
  }

  function handlePrevTask() {
    audioManager.play("click")
    if (currentIndex > 0) {
      setRawIndex((prev) => prev - 1)
    } else {
      setRawIndex(focusTasks.length - 1)
    }
  }

  function handleNextTask() {
    audioManager.play("click")
    if (currentIndex < focusTasks.length - 1) {
      setRawIndex((prev) => prev + 1)
    } else {
      setRawIndex(0)
    }
  }

  async function handleToggleSubtask(subtaskIndex: number) {
    if (!currentTask) return

    const updatedSubtasks = currentSubtasks.map((st, i) =>
      i === subtaskIndex ? { ...st, completed: !st.completed } : st
    )

    // Optimistic update
    setLocalSubtasks((prev) => ({ ...prev, [currentTask.id]: updatedSubtasks }))
    audioManager.play("click")

    try {
      await fetch(`/api/todos/${currentTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtasks: JSON.stringify(updatedSubtasks) }),
      })
      fetchTodos()
    } catch {
      // Revert on failure
      setLocalSubtasks((prev) => {
        const copy = { ...prev }
        delete copy[currentTask.id]
        return copy
      })
    }
  }

  // Timer progress
  const timerProgress = timerDuration > 0 ? ((timerDuration - timerRemaining) / timerDuration) * 100 : 0

  // Empty state - no tasks
  if (focusTasks.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="flex size-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-500/30"
            >
              <PartyPopper className="size-12 text-white" />
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg"
            >
              <Trophy className="size-4 text-white" />
            </motion.div>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              {t("focusNoTasks", lang)}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("focusNoTasksDesc", lang)}
            </p>
          </div>

          {/* Session stats summary */}
          {(sessionCompleted > 0 || sessionTimeSeconds > 0) && (
            <Card className="w-full max-w-sm rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="flex items-center justify-around p-6">
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle2 className="size-5 text-emerald-500" />
                  <span className="text-2xl font-extrabold text-foreground">{sessionCompleted}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {t("focusSessionTasks", lang)}
                  </span>
                </div>
                <div className="h-10 w-px bg-border/50" />
                <div className="flex flex-col items-center gap-1">
                  <Clock className="size-5 text-teal-500" />
                  <span className="text-2xl font-extrabold text-foreground">
                    {Math.floor(sessionTimeSeconds / 60)}m
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {t("focusSessionTime", lang)}
                  </span>
                </div>
                <div className="h-10 w-px bg-border/50" />
                <div className="flex flex-col items-center gap-1">
                  <Flame className="size-5 text-amber-500" />
                  <span className="text-2xl font-extrabold text-foreground">{streak}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {t("focusStreak", lang)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-2 py-4 sm:px-4">
      {/* Current Task - Hero Section */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTask?.id || "empty"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card
            className={`overflow-hidden rounded-2xl border-2 border-border/50 ${getPriorityBorderColor(currentTask?.priority || "medium")} bg-card/80 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/5`}
          >
            <CardContent className="p-6 sm:p-8">
              {/* Navigation + position indicator */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm">
                    <Zap className="size-4 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {currentIndex + 1} / {focusTasks.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevTask}
                    disabled={focusTasks.length <= 1}
                    className="size-8 rounded-lg"
                    aria-label="Previous task"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextTask}
                    disabled={focusTasks.length <= 1}
                    className="size-8 rounded-lg"
                    aria-label="Next task"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Task title with priority dot */}
              <div className="mb-3 flex items-start gap-3">
                <div
                  className={`mt-2 size-3 shrink-0 rounded-full ${getPriorityColor(currentTask?.priority || "medium")}`}
                />
                <h2 className="text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">
                  {currentTask?.title}
                </h2>
              </div>

              {/* Description */}
              {currentTask?.description && (
                <p className="mb-4 ml-6 text-sm leading-relaxed text-muted-foreground">
                  {currentTask.description}
                </p>
              )}

              {/* Tags */}
              {currentTask?.tags && currentTask.tags.length > 0 && (
                <div className="mb-5 ml-6 flex flex-wrap gap-2">
                  {currentTask.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="rounded-lg bg-emerald-500/10 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Subtasks */}
              {currentSubtasks.length > 0 && (
                <div className="mb-6 ml-6 space-y-2">
                  {currentSubtasks.map((subtask, idx) => (
                    <button
                      key={subtask.id}
                      onClick={() => handleToggleSubtask(idx)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted/50"
                    >
                      <div
                        className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                          subtask.completed
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {subtask.completed && (
                          <svg
                            viewBox="0 0 12 12"
                            fill="none"
                            className="size-3 text-white"
                          >
                            <path
                              d="M2 6l3 3 5-5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span
                        className={`text-sm transition-colors ${
                          subtask.completed
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }`}
                      >
                        {subtask.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleCompleteTask}
                  className="flex-1 gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-6 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl hover:shadow-emerald-500/30"
                  size="lg"
                >
                  <CheckCircle2 className="size-5" />
                  {t("focusComplete", lang)}
                </Button>
                <Button
                  onClick={handleSkipTask}
                  variant="outline"
                  className="gap-2 rounded-xl border-border/50 px-6 py-6 text-sm font-semibold"
                  size="lg"
                >
                  <SkipForward className="size-4" />
                  {t("focusSkip", lang)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Up Next Preview */}
      {nextTasks.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <ChevronRight className="size-3" />
            {t("focusNext", lang)}
          </h3>
          <div className="space-y-2">
            {nextTasks.map((task, idx) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5">
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-bold text-muted-foreground">
                      {currentIndex + idx + 2}
                    </span>
                    <div
                      className={`size-2 shrink-0 rounded-full ${getPriorityColor(task.priority)}`}
                    />
                    <span className="flex-1 truncate text-sm font-medium text-foreground">
                      {task.title}
                    </span>
                    {task.tags.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="hidden rounded-md bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400 sm:inline-flex"
                      >
                        {task.tags[0]}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Mini Timer Section */}
      <Card className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="p-5">
          <div className="flex items-center gap-5">
            {/* Progress Ring */}
            <div className="relative shrink-0">
              <svg width="80" height="80" viewBox="0 0 80 80" className="drop-shadow-sm">
                {/* Background ring */}
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  className="text-muted/30"
                />
                {/* Progress ring */}
                <defs>
                  <linearGradient id="focusTimerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="url(#focusTimerGradient)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - timerProgress / 100)}`}
                  transform="rotate(-90 40 40)"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-extrabold text-foreground">
                  {formatTime(timerRemaining)}
                </span>
              </div>
            </div>

            {/* Timer controls */}
            <div className="flex flex-1 flex-col gap-3">
              {/* Preset buttons */}
              <div className="flex gap-2">
                {TIMER_PRESETS.map((minutes, idx) => (
                  <button
                    key={minutes}
                    onClick={() => handleTimerPreset(idx)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                      activePreset === idx
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {t(
                      minutes === 5
                        ? "focusMin5"
                        : minutes === 15
                          ? "focusMin15"
                          : "focusMin25",
                      lang
                    )}
                  </button>
                ))}
              </div>

              {/* Play/Pause/Reset */}
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleTimerToggle}
                  size="sm"
                  className="gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700"
                >
                  {timerRunning ? (
                    <Pause className="size-3.5" />
                  ) : (
                    <Play className="size-3.5" />
                  )}
                  {timerRunning ? "Pause" : "Start"}
                </Button>
                <Button
                  onClick={handleTimerReset}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-lg text-muted-foreground"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Focus Stats Bottom Bar */}
      <div className="sticky bottom-0 z-10 -mx-2 border-t border-border/50 bg-background/80 px-2 py-3 backdrop-blur-xl sm:-mx-4 sm:px-4">
        <div className="flex items-center justify-around">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-foreground">{sessionCompleted}</p>
              <p className="text-[10px] font-medium text-muted-foreground">
                {t("focusSessionTasks", lang)}
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-border/50" />

          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10">
              <Clock className="size-4 text-teal-500" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-foreground">
                {Math.floor(sessionTimeSeconds / 60)}m
              </p>
              <p className="text-[10px] font-medium text-muted-foreground">
                {t("focusSessionTime", lang)}
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-border/50" />

          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10">
              <Flame className="size-4 text-amber-500" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-foreground">{streak}</p>
              <p className="text-[10px] font-medium text-muted-foreground">
                {t("focusStreak", lang)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

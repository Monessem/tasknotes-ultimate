"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { useTheme } from "next-themes"
import {
  Cloud,
  Timer,
  Palette,
  Bell,
  Database,
  Info,
  Download,
  Upload,
  Sun,
  Moon,
  Globe,
  Volume2,
  VolumeX,
  CheckCircle2,
  Loader2,
  User,
  Keyboard,
  Trash2,
  RotateCcw,
  CheckSquare,
  Target,
  Clock,
  ExternalLink,
  Code2,
  Heart,
  Zap,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const CITIES = [
  { value: "cairo", label: "Cairo" },
  { value: "riyadh", label: "Riyadh" },
  { value: "dubai", label: "Dubai" },
  { value: "jeddah", label: "Jeddah" },
  { value: "doha", label: "Doha" },
  { value: "kuwait", label: "Kuwait" },
  { value: "amman", label: "Amman" },
  { value: "casablanca", label: "Casablanca" },
]

const COLOR_THEMES = [
  { value: "emerald", label: "Emerald", from: "#10b981", to: "#0d9488", shadow: "rgba(16,185,129,0.3)" },
  { value: "ocean", label: "Ocean", from: "#3b82f6", to: "#0891b2", shadow: "rgba(59,130,246,0.3)" },
  { value: "sunset", label: "Sunset", from: "#f97316", to: "#e11d48", shadow: "rgba(249,115,22,0.3)" },
]

const SHORTCUTS = [
  { keys: ["⌘", "K"], descKey: "openCommandPalette" },
  { keys: ["⌘", "N"], descKey: "addNewTask" },
  { keys: ["⇧", "⌘", "N"], descKey: "addNewNote" },
  { keys: ["⇧", "⌘", "H"], descKey: "addNewHabit" },
  { keys: ["⌘", "D"], descKey: "toggleDarkMode" },
  { keys: ["?"], descKey: "showShortcuts" },
  { keys: ["Esc"], descKey: "closeDialog" },
]

const TECH_BADGES = [
  { name: "Next.js 16", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  { name: "TypeScript", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { name: "Prisma", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
  { name: "Tailwind CSS", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300" },
  { name: "Zustand", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  { name: "shadcn/ui", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
]

export function SettingsView() {
  const { settings, setSettings, todos, notes, habits, pomodoroSessions, historyEntries } = useAppStore()
  const lang = settings.language
  const { theme, setTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<"reset" | "clear" | null>(null)
  const [confirmInput, setConfirmInput] = useState("")

  // Profile stats
  const profileStats = useMemo(() => {
    const completedTasks = todos.filter((t) => t.completed && !t.deletedAt).length
    const totalFocusMinutes = pomodoroSessions
      .filter((s) => s.type === "work")
      .reduce((acc, s) => acc + s.duration, 0)

    // Calculate best habit streak
    let bestStreak = 0
    for (const habit of habits) {
      if (habit.deletedAt) continue
      const logs = useAppStore.getState().habitLogs
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
  }, [todos, notes, habits, pomodoroSessions, historyEntries])

  // Data statistics
  const dataStats = useMemo(() => ({
    totalTasks: todos.filter((t) => !t.deletedAt).length,
    totalNotes: notes.filter((n) => !n.deletedAt).length,
    totalHabits: habits.filter((h) => !h.deletedAt).length,
    totalSessions: pomodoroSessions.length,
  }), [todos, notes, habits, pomodoroSessions])

  // Browser notification permission state
  const [notifPermission, setNotifPermission] = useState<"default" | "granted" | "denied">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  )

  const updateSettings = useCallback(
    async (updates: Partial<typeof settings>) => {
      const newSettings = { ...settings, ...updates }
      setSettings(newSettings)
      setSaving(true)
      setSaveSuccess(false)
      try {
        const res = await fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })
        if (res.ok) {
          setSaveSuccess(true)
          setTimeout(() => setSaveSuccess(false), 2000)
        }
      } catch {
        // Silently fail
      } finally {
        setSaving(false)
      }
    },
    [settings, setSettings]
  )

  const handleExport = useCallback(async () => {
    try {
      const [todosRes, notesRes, habitsRes, habitLogsRes, foldersRes, pomodoroRes, historyRes, settingsRes] =
        await Promise.all([
          fetch("/api/todos?deleted=true"),
          fetch("/api/notes?deleted=true"),
          fetch("/api/habits"),
          fetch("/api/habit-logs"),
          fetch("/api/folders"),
          fetch("/api/pomodoro"),
          fetch("/api/history"),
          fetch("/api/settings"),
        ])

      const data = {
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
        todos: todosRes.ok ? await todosRes.json() : [],
        notes: notesRes.ok ? await notesRes.json() : [],
        habits: habitsRes.ok ? await habitsRes.json() : [],
        habitLogs: habitLogsRes.ok ? await habitLogsRes.json() : [],
        folders: foldersRes.ok ? await foldersRes.json() : [],
        pomodoroSessions: pomodoroRes.ok ? await pomodoroRes.json() : [],
        history: historyRes.ok ? await historyRes.json() : [],
        settings: settingsRes.ok ? await settingsRes.json() : {},
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `tasknotes-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(t("dataExported", lang))
    } catch {
      // Silently fail
    }
  }, [lang])

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const importPromises: Promise<void>[] = []

      if (data.folders && Array.isArray(data.folders)) {
        for (const folder of data.folders) {
          importPromises.push(
            fetch("/api/folders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(folder),
            }).then(() => {})
          )
        }
      }

      if (data.todos && Array.isArray(data.todos)) {
        for (const todo of data.todos) {
          importPromises.push(
            fetch("/api/todos", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(todo),
            }).then(() => {})
          )
        }
      }

      if (data.notes && Array.isArray(data.notes)) {
        for (const note of data.notes) {
          importPromises.push(
            fetch("/api/notes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(note),
            }).then(() => {})
          )
        }
      }

      if (data.habits && Array.isArray(data.habits)) {
        for (const habit of data.habits) {
          importPromises.push(
            fetch("/api/habits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(habit),
            }).then(() => {})
          )
        }
      }

      await Promise.all(importPromises)

      const store = useAppStore.getState()
      await store.fetchAllData()
      toast.success(t("dataImported", lang))
    } catch {
      toast.error(t("importFailed", lang))
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [lang])

  const handleResetDefaults = useCallback(async () => {
    setConfirmDialog(null)
    setConfirmInput("")
    const defaults = {
      weatherEnabled: true,
      weatherCity: "cairo",
      pomodoroWork: 25,
      pomodoroShortBreak: 5,
      pomodoroLongBreak: 15,
      taskReminders: true,
      soundEnabled: true,
      darkMode: false,
      language: "en" as const,
      autoSync: false,
      colorTheme: "emerald",
      fontSize: "medium",
      autoStartPomodoro: false,
      longBreakInterval: 4,
      reminderTime: "morning",
    }
    await updateSettings(defaults)
    setTheme("light")
    toast.success(t("settingsReset", lang))
  }, [updateSettings, setTheme, lang])

  const handleClearAllData = useCallback(async () => {
    setConfirmDialog(null)
    setConfirmInput("")
    try {
      // Delete all todos
      for (const todo of todos) {
        await fetch(`/api/todos/${todo.id}`, { method: "DELETE" })
      }
      // Delete all notes
      for (const note of notes) {
        await fetch(`/api/notes/${note.id}`, { method: "DELETE" })
      }
      // Delete all habits
      for (const habit of habits) {
        await fetch(`/api/habits/${habit.id}`, { method: "DELETE" })
      }
      // Refresh
      const store = useAppStore.getState()
      await store.fetchAllData()
      toast.success(t("dataCleared", lang))
    } catch {
      // Silently fail
    }
  }, [todos, notes, habits, lang])

  const requestBrowserNotif = useCallback(async () => {
    if (!("Notification" in window)) return
    const perm = await Notification.requestPermission()
    setNotifPermission(perm)
    if (perm === "granted") {
      toast.success(t("notificationsEnabled", lang))
    } else if (perm === "denied") {
      toast.error(t("notificationsDisabled", lang))
    }
  }, [lang])

  const getInitials = (name: string) => {
    if (!name) return "U"
    const parts = name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const sectionClass =
    "rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5"

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Save indicator */}
      <div className="flex items-center justify-end gap-2">
        {saving && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            <span>{lang === "ar" ? "جاري الحفظ..." : "Saving..."}</span>
          </div>
        )}
        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" />
            <span>{t("settingsSaved", lang)}</span>
          </div>
        )}
      </div>

      {/* ===================== 1. PROFILE SECTION ===================== */}
      <Card className={sectionClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40">
              <User className="size-4.5 text-violet-600 dark:text-violet-400" />
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
                <span>{t("memberSince", lang)} {formatDate(profileStats.memberSince)}</span>
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

      {/* ===================== 2. APPEARANCE SECTION ===================== */}
      <Card className={sectionClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40">
              <Palette className="size-4.5 text-teal-600 dark:text-teal-400" />
            </div>
            {t("appearance", lang)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dark Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {theme === "dark" ? (
                <Moon className="size-4 text-muted-foreground" />
              ) : (
                <Sun className="size-4 text-muted-foreground" />
              )}
              <Label htmlFor="dark-mode-toggle" className="text-sm font-medium">
                {t("darkMode", lang)}
              </Label>
            </div>
            <Switch
              id="dark-mode-toggle"
              checked={theme === "dark"}
              onCheckedChange={(checked) => {
                setTheme(checked ? "dark" : "light")
                updateSettings({ darkMode: checked })
              }}
            />
          </div>

          <Separator />

          {/* Color Theme Picker */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <Palette className="size-4 text-muted-foreground" />
              <Label className="text-sm font-medium">{t("colorTheme", lang)}</Label>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {COLOR_THEMES.map((ct) => (
                <button
                  key={ct.value}
                  type="button"
                  onClick={() => updateSettings({ colorTheme: ct.value })}
                  className={cn(
                    "group relative flex flex-col items-center gap-2.5 rounded-xl border-2 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
                    settings.colorTheme === ct.value
                      ? "border-emerald-500/40 shadow-lg"
                      : "border-border/30 hover:border-foreground/20"
                  )}
                >
                  <div
                    className={cn(
                      "size-12 rounded-full transition-all duration-300",
                      settings.colorTheme === ct.value ? "scale-110" : "group-hover:scale-110"
                    )}
                    style={{
                      background: `linear-gradient(135deg, ${ct.from}, ${ct.to})`,
                      boxShadow: settings.colorTheme === ct.value ? `0 6px 16px ${ct.shadow}` : "none",
                    }}
                  />
                  <span className="text-xs font-semibold text-foreground">{ct.label}</span>
                  {settings.colorTheme === ct.value && (
                    <div
                      className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full text-white shadow-md"
                      style={{ background: `linear-gradient(135deg, ${ct.from}, ${ct.to})` }}
                    >
                      <CheckCircle2 className="size-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe className="size-4 text-muted-foreground" />
              <Label className="text-sm font-medium">{t("language", lang)}</Label>
            </div>
            <Select
              value={settings.language}
              onValueChange={(value) =>
                updateSettings({ language: value as "en" | "ar" })
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Font Size */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Code2 className="size-4 text-muted-foreground" />
              <Label className="text-sm font-medium">{t("fontSize", lang)}</Label>
            </div>
            <Select
              value={settings.fontSize}
              onValueChange={(value) => updateSettings({ fontSize: value })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">{t("fontSmall", lang)}</SelectItem>
                <SelectItem value="medium">{t("fontMedium", lang)}</SelectItem>
                <SelectItem value="large">{t("fontLarge", lang)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ===================== 3. POMODORO TIMER SECTION ===================== */}
      <Card className={sectionClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/40 dark:to-pink-900/40">
              <Timer className="size-4.5 text-rose-600 dark:text-rose-400" />
            </div>
            {t("pomodoroSettings", lang)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {t("workDuration", lang)} ({t("minutes", lang)})
            </Label>
            <Input
              type="number"
              min={1}
              max={60}
              value={settings.pomodoroWork}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 25
                updateSettings({ pomodoroWork: Math.min(60, Math.max(1, val)) })
              }}
              className="w-20 text-center"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {t("shortBreakDuration", lang)} ({t("minutes", lang)})
            </Label>
            <Input
              type="number"
              min={1}
              max={30}
              value={settings.pomodoroShortBreak}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 5
                updateSettings({ pomodoroShortBreak: Math.min(30, Math.max(1, val)) })
              }}
              className="w-20 text-center"
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {t("longBreakDuration", lang)} ({t("minutes", lang)})
            </Label>
            <Input
              type="number"
              min={1}
              max={60}
              value={settings.pomodoroLongBreak}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 15
                updateSettings({ pomodoroLongBreak: Math.min(60, Math.max(1, val)) })
              }}
              className="w-20 text-center"
            />
          </div>

          <Separator />

          {/* Auto-start next session */}
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-start-toggle" className="text-sm font-medium">
              {t("autoStartNext", lang)}
            </Label>
            <Switch
              id="auto-start-toggle"
              checked={settings.autoStartPomodoro}
              onCheckedChange={(checked) => updateSettings({ autoStartPomodoro: checked })}
            />
          </div>

          <Separator />

          {/* Long break interval */}
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {t("longBreakAfter", lang)}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={2}
                max={10}
                value={settings.longBreakInterval}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 4
                  updateSettings({ longBreakInterval: Math.min(10, Math.max(2, val)) })
                }}
                className="w-20 text-center"
              />
              <span className="text-xs text-muted-foreground">{t("sessions", lang)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===================== 4. NOTIFICATIONS SECTION ===================== */}
      <Card className={sectionClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40">
              <Bell className="size-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            {t("notifications", lang)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="reminders-toggle" className="text-sm font-medium">
              {t("taskReminders", lang)}
            </Label>
            <Switch
              id="reminders-toggle"
              checked={settings.taskReminders}
              onCheckedChange={(checked) => updateSettings({ taskReminders: checked })}
            />
          </div>

          <Separator />

          {/* Reminder time preference */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="size-4 text-muted-foreground" />
              <Label className="text-sm font-medium">{t("reminderTimePref", lang)}</Label>
            </div>
            <Select
              value={settings.reminderTime}
              onValueChange={(value) => updateSettings({ reminderTime: value })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">{t("morningDigest", lang)}</SelectItem>
                <SelectItem value="evening">{t("eveningDigest", lang)}</SelectItem>
                <SelectItem value="both">{t("bothDigest", lang)}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {settings.soundEnabled ? (
                <Volume2 className="size-4 text-muted-foreground" />
              ) : (
                <VolumeX className="size-4 text-muted-foreground" />
              )}
              <Label htmlFor="sound-toggle" className="text-sm font-medium">
                {t("soundEnabled", lang)}
              </Label>
            </div>
            <Switch
              id="sound-toggle"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
            />
          </div>

          <Separator />

          {/* Browser notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="size-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">{t("browserNotifications", lang)}</Label>
                <p className="text-[10px] text-muted-foreground">
                  {notifPermission === "granted"
                    ? t("browserNotifGranted", lang)
                    : notifPermission === "denied"
                      ? t("browserNotifDenied", lang)
                      : t("browserNotifRequest", lang)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-border/50 text-xs"
              onClick={requestBrowserNotif}
              disabled={notifPermission === "granted"}
            >
              {notifPermission === "granted" ? (
                <CheckCircle2 className="mr-1.5 size-3.5 text-emerald-500" />
              ) : null}
              {notifPermission === "granted"
                ? t("unlocked", lang)
                : t("enableBrowserNotif", lang)}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===================== 5. WEATHER SECTION ===================== */}
      <Card className={sectionClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40">
              <Cloud className="size-4.5 text-amber-600 dark:text-amber-400" />
            </div>
            {t("weatherSettings", lang)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="weather-toggle" className="text-sm font-medium">
              {t("showWeather", lang)}
            </Label>
            <Switch
              id="weather-toggle"
              checked={settings.weatherEnabled}
              onCheckedChange={(checked) => updateSettings({ weatherEnabled: checked })}
            />
          </div>
          {settings.weatherEnabled && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {lang === "ar" ? "المدينة" : "City"}
                </Label>
                <Select
                  value={settings.weatherCity}
                  onValueChange={(value) => updateSettings({ weatherCity: value })}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CITIES.map((city) => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ===================== 6. DATA MANAGEMENT SECTION ===================== */}
      <Card className={sectionClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/40 dark:to-teal-900/40">
              <Database className="size-4.5 text-cyan-600 dark:text-cyan-400" />
            </div>
            {t("dataManagement", lang)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Data Statistics Card */}
          <div className="rounded-xl border border-border/30 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-4 dark:from-emerald-950/20 dark:to-teal-950/20">
            <div className="mb-3 flex items-center gap-2">
              <Database className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                {t("dataStatistics", lang)}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col items-center gap-0.5 rounded-lg bg-background/60 p-2">
                <CheckSquare className="size-3.5 text-emerald-500" />
                <span className="text-base font-bold">{dataStats.totalTasks}</span>
                <span className="text-[9px] text-muted-foreground">{t("totalTasks", lang)}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 rounded-lg bg-background/60 p-2">
                <Palette className="size-3.5 text-amber-500" />
                <span className="text-base font-bold">{dataStats.totalNotes}</span>
                <span className="text-[9px] text-muted-foreground">{t("totalNotesCount", lang)}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 rounded-lg bg-background/60 p-2">
                <Target className="size-3.5 text-rose-500" />
                <span className="text-base font-bold">{dataStats.totalHabits}</span>
                <span className="text-[9px] text-muted-foreground">{t("totalHabitsCount", lang)}</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 rounded-lg bg-background/60 p-2">
                <Timer className="size-3.5 text-cyan-500" />
                <span className="text-base font-bold">{dataStats.totalSessions}</span>
                <span className="text-[9px] text-muted-foreground">{t("totalSessions", lang)}</span>
              </div>
            </div>
          </div>

          {/* Export / Import Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleExport}
              variant="outline"
              className="h-auto flex-col gap-1.5 rounded-xl border-border/50 py-3"
            >
              <Download className="size-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium">{t("exportData", lang)}</span>
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              disabled={importing}
              className="h-auto flex-col gap-1.5 rounded-xl border-border/50 py-3"
            >
              {importing ? (
                <Loader2 className="size-5 animate-spin text-cyan-600 dark:text-cyan-400" />
              ) : (
                <Upload className="size-5 text-cyan-600 dark:text-cyan-400" />
              )}
              <span className="text-sm font-medium">
                {importing
                  ? lang === "ar"
                    ? "جاري الاستيراد..."
                    : "Importing..."
                  : t("importData", lang)}
              </span>
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />

          <Separator />

          {/* Danger Zone */}
          <div className="space-y-2.5 rounded-xl border border-rose-200/50 bg-rose-50/30 p-4 dark:border-rose-800/30 dark:bg-rose-950/10">
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-400">
              <Zap className="size-4" />
              {lang === "ar" ? "منطقة الخطر" : "Danger Zone"}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setConfirmDialog("reset")}
                variant="outline"
                className="gap-2 rounded-xl border-amber-200/50 bg-amber-50/50 text-amber-700 hover:bg-amber-100 dark:border-amber-800/30 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/40"
              >
                <RotateCcw className="size-4" />
                {t("resetToDefaults", lang)}
              </Button>
              <Button
                onClick={() => setConfirmDialog("clear")}
                variant="outline"
                className="gap-2 rounded-xl border-rose-200/50 bg-rose-50/50 text-rose-700 hover:bg-rose-100 dark:border-rose-800/30 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="size-4" />
                {t("clearAllData", lang)}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {t("resetToDefaultsDesc", lang)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ===================== 7. KEYBOARD SHORTCUTS REFERENCE ===================== */}
      <Card className={sectionClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40">
              <Keyboard className="size-4.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            {t("shortcutsReference", lang)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">{t("shortcutsReferenceDesc", lang)}</p>
          <div className="space-y-2">
            {SHORTCUTS.map((shortcut) => (
              <div
                key={shortcut.descKey}
                className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2"
              >
                <span className="text-xs text-muted-foreground">{t(shortcut.descKey, lang)}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, i) => (
                    <span key={i} className="flex items-center gap-1">
                      <kbd className="rounded border border-border/50 bg-muted/60 px-1.5 py-0.5 font-mono text-[10px]">
                        {key}
                      </kbd>
                      {i < shortcut.keys.length - 1 && (
                        <span className="text-[10px] text-muted-foreground">+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full gap-2 text-xs text-muted-foreground"
            onClick={() => {
              // Dispatch keyboard shortcut event to open shortcuts dialog
              window.dispatchEvent(new KeyboardEvent("keydown", { key: "?" }))
            }}
          >
            <ExternalLink className="size-3.5" />
            {t("openShortcuts", lang)}
          </Button>
        </CardContent>
      </Card>

      {/* ===================== 8. ABOUT SECTION ===================== */}
      <Card className={sectionClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40">
              <Info className="size-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            {t("aboutApp", lang)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">TaskNotes Ultimate</p>
              <p className="text-xs text-muted-foreground">{t("appSubtitle", lang)}</p>
            </div>
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
            >
              v1.0.0
            </Badge>
          </div>

          <Separator />

          {/* Tech Stack Badges */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Code2 className="size-3.5" />
              {t("techStack", lang)}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TECH_BADGES.map((badge) => (
                <Badge
                  key={badge.name}
                  variant="secondary"
                  className={cn("text-[10px]", badge.color)}
                >
                  {badge.name}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Credits */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Heart className="size-3.5 text-rose-500" />
            <span>{t("builtWith", lang)}</span>
          </div>
        </CardContent>
      </Card>

      {/* ===================== CONFIRM DIALOG ===================== */}
      <Dialog open={confirmDialog !== null} onOpenChange={(open) => { if (!open) { setConfirmDialog(null); setConfirmInput("") } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmDialog === "reset" ? t("resetToDefaults", lang) : t("clearAllData", lang)}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog === "reset"
                ? t("confirmResetDefaults", lang)
                : t("confirmClearData", lang)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {lang === "ar" ? "اكتب CONFIRM للمتابعة" : 'Type "CONFIRM" to proceed'}
            </Label>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="CONFIRM"
              className="rounded-xl"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => { setConfirmDialog(null); setConfirmInput("") }}
              className="rounded-xl"
            >
              {t("cancel", lang)}
            </Button>
            <Button
              variant="destructive"
              disabled={confirmInput !== "CONFIRM"}
              onClick={confirmDialog === "reset" ? handleResetDefaults : handleClearAllData}
              className="rounded-xl"
            >
              {confirmDialog === "reset" ? t("resetToDefaults", lang) : t("clearAllData", lang)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

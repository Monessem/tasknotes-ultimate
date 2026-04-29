"use client"

import { useState, useRef, useCallback } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

export function SettingsView() {
  const { settings, setSettings } = useAppStore()
  const lang = settings.language
  const { theme, setTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

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
    } catch {
      // Silently fail
    }
  }, [])

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Import each entity type
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

      // Refresh all data
      const store = useAppStore.getState()
      await store.fetchAllData()
    } catch {
      // Silently fail
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }, [])

  const sectionClass =
    "rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm transition-all hover:shadow-md"
  const sectionHeaderClass = "flex items-center gap-3"

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Save indicator */}
      <div className="flex items-center justify-end gap-2">
        {saving && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3" />
            <span>{t("settingsSaved", lang)}</span>
          </div>
        )}
      </div>

      {/* Weather Settings */}
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
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{t("language", lang) === "اللغة" ? "المدينة" : "City"}</Label>
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
          )}
        </CardContent>
      </Card>

      {/* Pomodoro Settings */}
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
        </CardContent>
      </Card>

      {/* Appearance */}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Palette className="size-4 text-muted-foreground" />
              <Label className="text-sm font-medium">
                {lang === "ar" ? "نظام الألوان" : "Color Theme"}
              </Label>
            </div>
            <Select
              value={settings.colorTheme}
              onValueChange={(value) => updateSettings({ colorTheme: value })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emerald">
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    Emerald
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
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
        </CardContent>
      </Card>

      {/* Backup */}
      <Card className={sectionClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 dark:from-cyan-900/40 dark:to-teal-900/40">
              <Database className="size-4.5 text-cyan-600 dark:text-cyan-400" />
            </div>
            {t("backup", lang)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleExport}
            variant="outline"
            className="w-full justify-start gap-2.5 rounded-xl border-border/50"
          >
            <Download className="size-4" />
            {t("exportData", lang)}
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            disabled={importing}
            className="w-full justify-start gap-2.5 rounded-xl border-border/50"
          >
            {importing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {importing
              ? lang === "ar"
                ? "جاري الاستيراد..."
                : "Importing..."
              : t("importData", lang)}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* About */}
      <Card className={sectionClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40">
              <Info className="size-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            {lang === "ar" ? "حول التطبيق" : "About"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">TaskNotes Ultimate</p>
              <p className="text-xs text-muted-foreground">
                {t("appSubtitle", lang)}
              </p>
            </div>
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
            >
              v1.0.0
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

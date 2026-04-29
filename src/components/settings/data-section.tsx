"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import {
  Database,
  Download,
  Upload,
  Loader2,
  CheckSquare,
  Palette,
  Target,
  Timer,
  Trash2,
  RotateCcw,
  Zap,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { sectionClass, type UpdateSettingsFn, type Lang } from "./settings-shared"

interface DataSectionProps {
  updateSettings: UpdateSettingsFn
  lang: Lang
  onResetDefaults: () => void
  onClearAllData: () => void
}

export function DataSection({ lang, onResetDefaults, onClearAllData }: DataSectionProps) {
  const { todos, notes, habits, pomodoroSessions } = useAppStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  // Data statistics
  const dataStats = useMemo(() => ({
    totalTasks: todos.filter((t) => !t.deletedAt).length,
    totalNotes: notes.filter((n) => !n.deletedAt).length,
    totalHabits: habits.filter((h) => !h.deletedAt).length,
    totalSessions: pomodoroSessions.length,
  }), [todos, notes, habits, pomodoroSessions])

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

  return (
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
              onClick={onResetDefaults}
              variant="outline"
              className="gap-2 rounded-xl border-amber-200/50 bg-amber-50/50 text-amber-700 hover:bg-amber-100 dark:border-amber-800/30 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:bg-amber-950/40"
            >
              <RotateCcw className="size-4" />
              {t("resetToDefaults", lang)}
            </Button>
            <Button
              onClick={onClearAllData}
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
  )
}

"use client"

import { useState, useCallback } from "react"
import { useTheme } from "next-themes"
import {
  CheckCircle2,
  Loader2,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProfileSection } from "@/components/settings/profile-section"
import { AppearanceSection } from "@/components/settings/appearance-section"
import { PomodoroSection } from "@/components/settings/pomodoro-section"
import { NotificationsSection } from "@/components/settings/notifications-section"
import { WeatherSection } from "@/components/settings/weather-section"
import { DataSection } from "@/components/settings/data-section"
import { SecuritySection } from "@/components/settings/security-section"
import { AboutSection } from "@/components/settings/about-section"
import type { UpdateSettingsFn } from "@/components/settings/settings-shared"

export function SettingsView() {
  const { settings, setSettings, todos, notes, habits } = useAppStore()
  const lang = settings.language
  const { setTheme } = useTheme()
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<"reset" | "clear" | null>(null)
  const [confirmInput, setConfirmInput] = useState("")

  const updateSettings: UpdateSettingsFn = useCallback(
    async (updates) => {
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
      privacyMode: false,
      pomodoroEnabled: true,
      achievementsEnabled: true,
      weeklyReportEnabled: true,
      weatherApiKey: "",
      webhookUrl: "",
      gitHubToken: "",
      gistId: "",
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

      {/* 1. Profile */}
      <ProfileSection settings={settings} updateSettings={updateSettings} lang={lang} />

      {/* 2. Appearance */}
      <AppearanceSection settings={settings} updateSettings={updateSettings} lang={lang} />

      {/* 3. Pomodoro Timer */}
      <PomodoroSection settings={settings} updateSettings={updateSettings} lang={lang} />

      {/* 4. Notifications */}
      <NotificationsSection settings={settings} updateSettings={updateSettings} lang={lang} />

      {/* 5. Weather */}
      <WeatherSection settings={settings} updateSettings={updateSettings} lang={lang} />

      {/* 6. Data Management */}
      <DataSection
        updateSettings={updateSettings}
        lang={lang}
        onResetDefaults={() => setConfirmDialog("reset")}
        onClearAllData={() => setConfirmDialog("clear")}
      />

      {/* 7-10. Security, API Integrations, Feature Toggles, Audit & Logs */}
      <SecuritySection settings={settings} updateSettings={updateSettings} lang={lang} />

      {/* 11-12. Keyboard Shortcuts & About */}
      <AboutSection lang={lang} />

      {/* Confirm Dialog */}
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

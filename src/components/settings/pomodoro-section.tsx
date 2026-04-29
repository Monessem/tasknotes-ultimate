"use client"

import { Timer } from "lucide-react"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { sectionClass, type UpdateSettingsFn, type Lang } from "./settings-shared"

interface PomodoroSectionProps {
  settings: {
    pomodoroWork: number
    pomodoroShortBreak: number
    pomodoroLongBreak: number
    autoStartPomodoro: boolean
    longBreakInterval: number
  }
  updateSettings: UpdateSettingsFn
  lang: Lang
}

export function PomodoroSection({ settings, updateSettings, lang }: PomodoroSectionProps) {
  return (
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
  )
}

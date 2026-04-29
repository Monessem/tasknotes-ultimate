"use client"

import {
  Shield,
  Plug,
  ToggleLeft,
  FileText,
  Cloud,
  Timer,
  Target,
  Trash2,
  Download,
  Key,
  Link,
  Eye,
  EyeOff,
  Code2,
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
import { toast } from "sonner"
import { sectionClass, type UpdateSettingsFn, type Lang } from "./settings-shared"

interface SecuritySectionProps {
  settings: {
    privacyMode: boolean
    weatherApiKey: string
    gitHubToken: string
    gistId: string
    webhookUrl: string
    weatherEnabled: boolean
    pomodoroEnabled: boolean
    achievementsEnabled: boolean
    weeklyReportEnabled: boolean
  }
  updateSettings: UpdateSettingsFn
  lang: Lang
}

export function SecuritySection({ settings, updateSettings, lang }: SecuritySectionProps) {
  const { historyEntries } = useAppStore()

  return (
    <>
      {/* Security & Privacy */}
      <Card className={sectionClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40">
              <Shield className="size-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            {t("securityPrivacy", lang)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Data Encryption */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Key className="size-4 text-muted-foreground" />
              <div>
                <Label htmlFor="encryption-toggle" className="text-sm font-medium">
                  {t("dataEncryption", lang)}
                </Label>
                <p className="text-[10px] text-muted-foreground">{t("dataEncryptionDesc", lang)}</p>
              </div>
            </div>
            <Switch
              id="encryption-toggle"
              checked={true}
              disabled
              onCheckedChange={() => {}}
            />
          </div>

          <Separator />

          {/* Secure API Access */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="size-4 text-muted-foreground" />
              <div>
                <Label htmlFor="secure-api-toggle" className="text-sm font-medium">
                  {t("secureApiAccess", lang)}
                </Label>
                <p className="text-[10px] text-muted-foreground">{t("secureApiAccessDesc", lang)}</p>
              </div>
            </div>
            <Switch
              id="secure-api-toggle"
              checked={false}
              disabled
              onCheckedChange={() => {}}
            />
          </div>

          <Separator />

          {/* Clear Browsing Data */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Trash2 className="size-4 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">{t("clearBrowsingData", lang)}</Label>
                <p className="text-[10px] text-muted-foreground">{t("clearBrowsingDataDesc", lang)}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-border/50 text-xs"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.clear()
                  toast.success(t("browsingDataCleared", lang))
                }
              }}
            >
              {t("clearBrowsingData", lang)}
            </Button>
          </div>

          <Separator />

          {/* Privacy Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {settings.privacyMode ? (
                <EyeOff className="size-4 text-muted-foreground" />
              ) : (
                <Eye className="size-4 text-muted-foreground" />
              )}
              <div>
                <Label htmlFor="privacy-mode-toggle" className="text-sm font-medium">
                  {t("privacyMode", lang)}
                </Label>
                <p className="text-[10px] text-muted-foreground">{t("privacyModeDesc", lang)}</p>
              </div>
            </div>
            <Switch
              id="privacy-mode-toggle"
              checked={settings.privacyMode}
              onCheckedChange={(checked) => updateSettings({ privacyMode: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* API Integrations */}
      <Card className={sectionClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40">
              <Plug className="size-4.5 text-teal-600 dark:text-teal-400" />
            </div>
            {t("apiIntegrations", lang)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OpenWeatherMap API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Cloud className="size-4 text-muted-foreground" />
              <Label className="text-sm font-medium">{t("weatherApiKeyLabel", lang)}</Label>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("weatherApiKeyDesc", lang)}</p>
            <Input
              value={settings.weatherApiKey}
              onChange={(e) => updateSettings({ weatherApiKey: e.target.value })}
              placeholder="OpenWeatherMap API Key..."
              className="h-9 rounded-xl border-border/50 bg-background/50 text-sm"
              type="password"
            />
          </div>

          <Separator />

          {/* GitHub Sync */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Code2 className="size-4 text-muted-foreground" />
              <Label className="text-sm font-medium">{t("githubSync", lang)}</Label>
            </div>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">{t("githubToken", lang)}</Label>
                <Input
                  value={settings.gitHubToken}
                  onChange={(e) => updateSettings({ gitHubToken: e.target.value })}
                  placeholder={t("githubTokenPlaceholder", lang)}
                  className="h-9 rounded-xl border-border/50 bg-background/50 text-sm"
                  type="password"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground">{t("gistId", lang)}</Label>
                <Input
                  value={settings.gistId}
                  onChange={(e) => updateSettings({ gistId: e.target.value })}
                  placeholder={t("gistIdPlaceholder", lang)}
                  className="h-9 rounded-xl border-border/50 bg-background/50 text-sm"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Webhook URL */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Link className="size-4 text-muted-foreground" />
              <Label className="text-sm font-medium">{t("webhookUrl", lang)}</Label>
            </div>
            <p className="text-[10px] text-muted-foreground">{t("webhookUrlDesc", lang)}</p>
            <Input
              value={settings.webhookUrl}
              onChange={(e) => updateSettings({ webhookUrl: e.target.value })}
              placeholder={t("webhookUrlPlaceholder", lang)}
              className="h-9 rounded-xl border-border/50 bg-background/50 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Toggles */}
      <Card className={sectionClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40">
              <ToggleLeft className="size-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            {t("featureToggles", lang)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Weather Widget */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Cloud className="size-4 text-muted-foreground" />
              <div>
                <Label htmlFor="weather-widget-toggle" className="text-sm font-medium">
                  {t("weatherWidgetToggle", lang)}
                </Label>
                <p className="text-[10px] text-muted-foreground">{t("weatherWidgetToggleDesc", lang)}</p>
              </div>
            </div>
            <Switch
              id="weather-widget-toggle"
              checked={settings.weatherEnabled}
              onCheckedChange={(checked) => updateSettings({ weatherEnabled: checked })}
            />
          </div>

          <Separator />

          {/* Pomodoro Timer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Timer className="size-4 text-muted-foreground" />
              <div>
                <Label htmlFor="pomodoro-toggle" className="text-sm font-medium">
                  {t("pomodoroTimerToggle", lang)}
                </Label>
                <p className="text-[10px] text-muted-foreground">{t("pomodoroTimerToggleDesc", lang)}</p>
              </div>
            </div>
            <Switch
              id="pomodoro-toggle"
              checked={settings.pomodoroEnabled}
              onCheckedChange={(checked) => updateSettings({ pomodoroEnabled: checked })}
            />
          </div>

          <Separator />

          {/* Achievements System */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Target className="size-4 text-muted-foreground" />
              <div>
                <Label htmlFor="achievements-toggle" className="text-sm font-medium">
                  {t("achievementsToggle", lang)}
                </Label>
                <p className="text-[10px] text-muted-foreground">{t("achievementsToggleDesc", lang)}</p>
              </div>
            </div>
            <Switch
              id="achievements-toggle"
              checked={settings.achievementsEnabled}
              onCheckedChange={(checked) => updateSettings({ achievementsEnabled: checked })}
            />
          </div>

          <Separator />

          {/* Weekly Report */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="size-4 text-muted-foreground" />
              <div>
                <Label htmlFor="weekly-report-toggle" className="text-sm font-medium">
                  {t("weeklyReportToggle", lang)}
                </Label>
                <p className="text-[10px] text-muted-foreground">{t("weeklyReportToggleDesc", lang)}</p>
              </div>
            </div>
            <Switch
              id="weekly-report-toggle"
              checked={settings.weeklyReportEnabled}
              onCheckedChange={(checked) => updateSettings({ weeklyReportEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Audit & Logs */}
      <Card className={sectionClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40">
              <FileText className="size-4.5 text-teal-600 dark:text-teal-400" />
            </div>
            {t("auditLogs", lang)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">{t("auditLogsDesc", lang)}</p>

          {/* Recent Activity List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {historyEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <FileText className="size-8 text-muted-foreground/30" />
                <p className="mt-2 text-xs text-muted-foreground">{t("noHistoryEntries", lang)}</p>
              </div>
            ) : (
              historyEntries.slice(0, 5).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-xl bg-background/50 px-3 py-2.5"
                >
                  <div className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-lg",
                    entry.action === "create" && "bg-emerald-100 dark:bg-emerald-900/40",
                    entry.action === "update" && "bg-amber-100 dark:bg-amber-900/40",
                    entry.action === "delete" && "bg-rose-100 dark:bg-rose-900/40",
                    entry.action === "complete" && "bg-teal-100 dark:bg-teal-900/40",
                    entry.action === "flag" && "bg-amber-100 dark:bg-amber-900/40",
                    entry.action === "restore" && "bg-cyan-100 dark:bg-cyan-900/40",
                  )}>
                    <span className="text-xs">
                      {entry.action === "create" && "\u2795"}
                      {entry.action === "update" && "\u270F\uFE0F"}
                      {entry.action === "delete" && "\uD83D\uDCCC"}
                      {entry.action === "complete" && "\u2705"}
                      {entry.action === "flag" && "\uD83D\uDEA9"}
                      {entry.action === "restore" && "\uD83D\uDD04"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{entry.itemTitle}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {entry.action} · {entry.itemType} · {new Date(entry.createdAt).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={async () => {
                try {
                  await fetch("/api/history", { method: "DELETE" })
                  const store = useAppStore.getState()
                  await store.fetchHistory()
                  toast.success(t("historyCleared", lang))
                } catch {
                  // silently fail
                }
              }}
              variant="outline"
              disabled={historyEntries.length === 0}
              className="gap-2 rounded-xl border-border/50 text-xs"
            >
              <Trash2 className="size-3.5" />
              {t("clearHistory", lang)}
            </Button>
            <Button
              onClick={() => {
                const blob = new Blob([JSON.stringify(historyEntries, null, 2)], { type: "application/json" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `activity-log-${new Date().toISOString().split("T")[0]}.json`
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
                toast.success(t("activityLogExported", lang))
              }}
              variant="outline"
              disabled={historyEntries.length === 0}
              className="gap-2 rounded-xl border-border/50 text-xs"
            >
              <Download className="size-3.5" />
              {t("exportActivityLog", lang)}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

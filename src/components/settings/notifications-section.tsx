"use client"

import { useState, useCallback } from "react"
import {
  Bell,
  Clock,
  Volume2,
  VolumeX,
  CheckCircle2,
} from "lucide-react"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { sectionClass, type UpdateSettingsFn, type Lang } from "./settings-shared"

interface NotificationsSectionProps {
  settings: {
    taskReminders: boolean
    reminderTime: string
    soundEnabled: boolean
  }
  updateSettings: UpdateSettingsFn
  lang: Lang
}

export function NotificationsSection({ settings, updateSettings, lang }: NotificationsSectionProps) {
  const [notifPermission, setNotifPermission] = useState<"default" | "granted" | "denied">(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  )

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

  return (
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
  )
}

"use client"

import { Cloud } from "lucide-react"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { sectionClass, CITIES, type UpdateSettingsFn, type Lang } from "./settings-shared"

interface WeatherSectionProps {
  settings: {
    weatherEnabled: boolean
    weatherCity: string
  }
  updateSettings: UpdateSettingsFn
  lang: Lang
}

export function WeatherSection({ settings, updateSettings, lang }: WeatherSectionProps) {
  return (
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
  )
}

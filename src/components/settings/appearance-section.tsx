"use client"

import { useTheme } from "next-themes"
import {
  Palette,
  Sun,
  Moon,
  Globe,
  CheckCircle2,
  Code2,
} from "lucide-react"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
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
import { sectionClass, COLOR_THEMES, type UpdateSettingsFn, type Lang } from "./settings-shared"

interface AppearanceSectionProps {
  settings: {
    colorTheme: string
    language: Lang
    fontSize: string
    darkMode: boolean
  }
  updateSettings: UpdateSettingsFn
  lang: Lang
}

export function AppearanceSection({ settings, updateSettings, lang }: AppearanceSectionProps) {
  const { theme, setTheme } = useTheme()

  return (
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
  )
}

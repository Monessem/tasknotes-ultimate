"use client"

import {
  Info,
  Keyboard,
  ExternalLink,
  Code2,
  Heart,
} from "lucide-react"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { sectionClass, SHORTCUTS, TECH_BADGES, type Lang } from "./settings-shared"

interface AboutSectionProps {
  lang: Lang
}

export function AboutSection({ lang }: AboutSectionProps) {
  return (
    <>
      {/* Keyboard Shortcuts Reference */}
      <Card className={sectionClass}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-base">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-emerald-100 dark:from-teal-900/40 dark:to-emerald-900/40">
              <Keyboard className="size-4.5 text-teal-600 dark:text-teal-400" />
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

      {/* About App */}
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
    </>
  )
}

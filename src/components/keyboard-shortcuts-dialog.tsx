"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Keyboard } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"

interface ShortcutEntry {
  labelKey: string
  keys: string[]
}

interface ShortcutSection {
  titleKey: string
  shortcuts: ShortcutEntry[]
}

function detectMac(): boolean {
  if (typeof navigator === "undefined") return false
  return /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-border/50 bg-muted/60 px-2 py-1 text-xs font-mono text-muted-foreground">
      {children}
    </kbd>
  )
}

function ShortcutRow({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <Kbd key={i}>{key}</Kbd>
        ))}
      </div>
    </div>
  )
}

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false)
  const { settings } = useAppStore()
  const lang = settings.language
  const isMac = detectMac()

  const mod = isMac ? "⌘" : "Ctrl"
  const shift = isMac ? "⇧" : "Shift"

  const sections: ShortcutSection[] = [
    {
      titleKey: "shortcutNavigation",
      shortcuts: [
        {
          labelKey: "openCommandPalette",
          keys: [mod, "K"],
        },
      ],
    },
    {
      titleKey: "shortcutActions",
      shortcuts: [
        {
          labelKey: "addNewTask",
          keys: [shift, mod, "T"],
        },
        {
          labelKey: "addNewNote",
          keys: [shift, mod, "N"],
        },
        {
          labelKey: "addNewHabit",
          keys: [shift, mod, "H"],
        },
        {
          labelKey: "toggleDarkMode",
          keys: [shift, mod, "D"],
        },
      ],
    },
    {
      titleKey: "shortcutGeneral",
      shortcuts: [
        {
          labelKey: "showShortcuts",
          keys: ["?"],
        },
        {
          labelKey: "closeDialog",
          keys: ["Esc"],
        },
      ],
    },
  ]

  // Listen for ? key to open this dialog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }
      // Don't trigger if modifier keys are held
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg md:max-w-xl border-border/50 bg-card/90 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
              <Keyboard className="size-4" />
            </div>
            {t("keyboardShortcuts", lang)}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("keyboardShortcuts", lang)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 overflow-y-auto max-h-[60vh] pr-1">
          {sections.map((section) => (
            <div key={section.titleKey}>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {t(section.titleKey, lang)}
              </h4>
              <div className="rounded-xl border border-border/40 bg-muted/20 divide-y divide-border/20">
                {section.shortcuts.map((shortcut) => (
                  <ShortcutRow
                    key={shortcut.labelKey}
                    label={t(shortcut.labelKey, lang)}
                    keys={shortcut.keys}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useCallback } from "react"
import {
  History,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  Flag,
  RotateCcw,
  CheckSquare,
  StickyNote,
  Target,
  FolderOpen,
  Trash,
  AlertTriangle,
} from "lucide-react"
import { useAppStore, type HistoryEntry } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const actionConfig: Record<
  HistoryEntry["action"],
  { icon: React.ElementType; colorClass: string; bgClass: string }
> = {
  create: {
    icon: Plus,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  update: {
    icon: Pencil,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-100 dark:bg-amber-900/30",
  },
  delete: {
    icon: Trash2,
    colorClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-100 dark:bg-rose-900/30",
  },
  complete: {
    icon: CheckCircle2,
    colorClass: "text-teal-600 dark:text-teal-400",
    bgClass: "bg-teal-100 dark:bg-teal-900/30",
  },
  flag: {
    icon: Flag,
    colorClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-100 dark:bg-orange-900/30",
  },
  restore: {
    icon: RotateCcw,
    colorClass: "text-cyan-600 dark:text-cyan-400",
    bgClass: "bg-cyan-100 dark:bg-cyan-900/30",
  },
}

const itemTypeConfig: Record<
  HistoryEntry["itemType"],
  { icon: React.ElementType; labelKey: string }
> = {
  task: { icon: CheckSquare, labelKey: "todos" },
  note: { icon: StickyNote, labelKey: "notes" },
  habit: { icon: Target, labelKey: "habits" },
  folder: { icon: FolderOpen, labelKey: "folders" },
}

const actionLabelKeys: Record<HistoryEntry["action"], string> = {
  create: "add",
  update: "edit",
  delete: "delete",
  complete: "completed",
  flag: "flag",
  restore: "restore",
}

export function HistoryView() {
  const { historyEntries, fetchHistory } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language

  const handleClearHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history", { method: "DELETE" })
      if (res.ok) {
        await fetchHistory()
      }
    } catch {
      // Silently fail
    }
  }, [fetchHistory])

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1)
      return lang === "ar" ? "الآن" : "Just now"
    if (diffMins < 60)
      return lang === "ar"
        ? `منذ ${diffMins} دقيقة`
        : `${diffMins}m ago`
    if (diffHours < 24)
      return lang === "ar"
        ? `منذ ${diffHours} ساعة`
        : `${diffHours}h ago`
    if (diffDays < 7)
      return lang === "ar"
        ? `منذ ${diffDays} أيام`
        : `${diffDays}d ago`
    return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Group entries by date
  const groupedEntries: Record<string, HistoryEntry[]> = {}
  for (const entry of historyEntries) {
    const date = new Date(entry.createdAt).toISOString().split("T")[0]
    if (!groupedEntries[date]) groupedEntries[date] = []
    groupedEntries[date].push(entry)
  }

  const sortedDates = Object.keys(groupedEntries).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]

    if (dateStr === today) return lang === "ar" ? "اليوم" : "Today"
    if (dateStr === yesterday) return lang === "ar" ? "أمس" : "Yesterday"
    return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    })
  }

  if (historyEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
          <History className="size-7 text-emerald-500" />
        </div>
        <p className="text-lg font-semibold text-foreground">
          {t("history", lang)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === "ar"
            ? "ستظهر أنشطتك هنا"
            : "Your activity will appear here"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge
          variant="secondary"
          className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
        >
          {historyEntries.length} {lang === "ar" ? "إدخال" : "entries"}
        </Badge>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:hover:bg-rose-950"
            >
              <Trash className="size-3.5" />
              {lang === "ar" ? "مسح السجل" : "Clear History"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-rose-500" />
                {lang === "ar" ? "مسح السجل" : "Clear History"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("cannotUndo", lang)}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("cancel", lang)}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearHistory}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {t("delete", lang)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {sortedDates.map((dateStr) => (
          <div key={dateStr}>
            {/* Date header */}
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <History className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                {getDateLabel(dateStr)}
              </h3>
              <div className="flex-1 border-t border-border/50" />
            </div>

            {/* Entries */}
            <div className="relative ml-4 space-y-1 border-l-2 border-emerald-200 pl-6 dark:border-emerald-800">
              {groupedEntries[dateStr].map((entry) => {
                const actionCfg = actionConfig[entry.action]
                const itemCfg = itemTypeConfig[entry.itemType]
                const ActionIcon = actionCfg.icon
                const ItemIcon = itemCfg.icon

                return (
                  <div
                    key={entry.id}
                    className="group relative flex items-start gap-3 rounded-xl border border-border/30 bg-card/60 p-3 backdrop-blur-sm transition-all hover:bg-card/80 hover:shadow-sm"
                  >
                    {/* Timeline dot */}
                    <div
                      className={cn(
                        "absolute -left-[31px] top-3.5 flex size-3 items-center justify-center rounded-full",
                        entry.action === "create" && "bg-emerald-500",
                        entry.action === "update" && "bg-amber-500",
                        entry.action === "delete" && "bg-rose-500",
                        entry.action === "complete" && "bg-teal-500",
                        entry.action === "flag" && "bg-orange-500",
                        entry.action === "restore" && "bg-cyan-500"
                      )}
                    />

                    {/* Action icon */}
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg",
                        actionCfg.bgClass
                      )}
                    >
                      <ActionIcon className={cn("size-3.5", actionCfg.colorClass)} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-foreground">
                          {t(actionLabelKeys[entry.action], lang)}
                        </span>
                        <div className="flex items-center gap-1">
                          <ItemIcon className="size-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">
                            {t(itemCfg.labelKey, lang)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-0.5 truncate text-sm font-medium text-foreground/80">
                        {entry.itemTitle}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatTimestamp(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

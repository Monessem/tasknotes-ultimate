"use client"

import { useState, useMemo, useCallback } from "react"
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
  Search,
  TrendingUp,
  CalendarDays,
  Activity,
} from "lucide-react"
import { useAppStore, type HistoryEntry } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { getWeekStartDate } from "@/lib/stats"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  { icon: React.ElementType; colorClass: string; bgClass: string; dotColor: string }
> = {
  create: {
    icon: Plus,
    colorClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
    dotColor: "bg-emerald-500",
  },
  update: {
    icon: Pencil,
    colorClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-100 dark:bg-amber-900/30",
    dotColor: "bg-amber-500",
  },
  delete: {
    icon: Trash2,
    colorClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-100 dark:bg-rose-900/30",
    dotColor: "bg-rose-500",
  },
  complete: {
    icon: CheckCircle2,
    colorClass: "text-teal-600 dark:text-teal-400",
    bgClass: "bg-teal-100 dark:bg-teal-900/30",
    dotColor: "bg-teal-500",
  },
  flag: {
    icon: Flag,
    colorClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-100 dark:bg-orange-900/30",
    dotColor: "bg-orange-500",
  },
  restore: {
    icon: RotateCcw,
    colorClass: "text-cyan-600 dark:text-cyan-400",
    bgClass: "bg-cyan-100 dark:bg-cyan-900/30",
    dotColor: "bg-cyan-500",
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

type ActionFilter = "all" | HistoryEntry["action"]

const ACTION_OPTIONS: { value: ActionFilter; labelKey: string }[] = [
  { value: "all", labelKey: "allActions" },
  { value: "create", labelKey: "add" },
  { value: "update", labelKey: "edit" },
  { value: "delete", labelKey: "delete" },
  { value: "complete", labelKey: "completed" },
  { value: "flag", labelKey: "flag" },
  { value: "restore", labelKey: "restore" },
]

export function HistoryView() {
  const { historyEntries, fetchHistory, searchQuery, setSearchQuery } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language
  const [actionFilter, setActionFilter] = useState<ActionFilter>("all")

  const handleClearHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history", { method: "DELETE" })
      if (res.ok) {
        await fetchHistory()
      }
    } catch (err) {
      console.error("Failed to clear history:", err)
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

  // Filter entries
  const filteredEntries = useMemo(() => {
    let entries = historyEntries

    // Filter by action type
    if (actionFilter !== "all") {
      entries = entries.filter((e) => e.action === actionFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      entries = entries.filter((e) =>
        e.itemTitle.toLowerCase().includes(q)
      )
    }

    return entries
  }, [historyEntries, actionFilter, searchQuery])

  // Summary stats
  const summaryStats = useMemo(() => {
    const total = historyEntries.length

    // Most active day this week
    const startOfWeek = getWeekStartDate()

    const thisWeekEntries = historyEntries.filter(
      (e) => new Date(e.createdAt) >= startOfWeek
    )
    const dayCountMap: Record<string, number> = {}
    for (const entry of thisWeekEntries) {
      const dateStr = new Date(entry.createdAt).toISOString().split("T")[0]
      dayCountMap[dateStr] = (dayCountMap[dateStr] || 0) + 1
    }
    const mostActiveDay = Object.entries(dayCountMap).sort(
      (a, b) => b[1] - a[1]
    )[0]

    const mostActiveDayLabel = mostActiveDay
      ? new Date(mostActiveDay[0]).toLocaleDateString(
          lang === "ar" ? "ar-SA" : "en-US",
          { weekday: "short" }
        )
      : "—"

    // Most common action type
    const actionCountMap: Record<string, number> = {}
    for (const entry of historyEntries) {
      actionCountMap[entry.action] = (actionCountMap[entry.action] || 0) + 1
    }
    const mostCommonAction = Object.entries(actionCountMap).sort(
      (a, b) => b[1] - a[1]
    )[0]

    return {
      total,
      mostActiveDay: mostActiveDayLabel,
      mostCommonAction: mostCommonAction
        ? t(actionLabelKeys[mostCommonAction[0] as HistoryEntry["action"]], lang)
        : "—",
    }
  }, [historyEntries, lang])

  // Group filtered entries by date
  const groupedEntries: Record<string, HistoryEntry[]> = {}
  for (const entry of filteredEntries) {
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
      {/* Header with Summary Stats */}
      <div className="space-y-4">
        {/* Summary Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/80 px-3 py-3 backdrop-blur-sm">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15">
              <Activity className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-extrabold text-foreground">{summaryStats.total}</p>
              <p className="text-[10px] font-medium text-muted-foreground">
                {lang === "ar" ? "إجمالي الإدخالات" : "Total entries"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/80 px-3 py-3 backdrop-blur-sm">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
              <CalendarDays className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-foreground">{summaryStats.mostActiveDay}</p>
              <p className="text-[10px] font-medium text-muted-foreground">{t("mostActiveDay", lang)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-card/80 px-3 py-3 backdrop-blur-sm">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/15">
              <TrendingUp className="size-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-foreground">{summaryStats.mostCommonAction}</p>
              <p className="text-[10px] font-medium text-muted-foreground">
                {lang === "ar" ? "الأكثر شيوعاً" : "Most common"}
              </p>
            </div>
          </div>
        </div>

        {/* Filter + Search Row */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search", lang)}
              className="h-8 rounded-xl border-border/50 bg-card/80 pl-8 text-xs backdrop-blur-sm placeholder:text-muted-foreground/60 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
            />
          </div>

          {/* Action filter dropdown */}
          <Select
            value={actionFilter}
            onValueChange={(val) => setActionFilter(val as ActionFilter)}
          >
            <SelectTrigger
              size="sm"
              className="h-8 w-auto rounded-xl border-border/50 bg-card/80 text-xs backdrop-blur-sm focus:ring-emerald-400/20"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {ACTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {t(opt.labelKey, lang)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Clear history */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-800 dark:hover:bg-rose-950"
              >
                <Trash className="size-3" />
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

        {/* Active filter badge */}
        {(actionFilter !== "all" || searchQuery.trim()) && (
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
            >
              {filteredEntries.length} {lang === "ar" ? "إدخال" : "entries"}
            </Badge>
            {actionFilter !== "all" && (
              <Badge
                variant="outline"
                className="cursor-pointer border-amber-300 text-amber-600 dark:border-amber-700 dark:text-amber-400"
                onClick={() => setActionFilter("all")}
              >
                {t(actionLabelKeys[actionFilter as HistoryEntry["action"]], lang)} ✕
              </Badge>
            )}
            {searchQuery.trim() && (
              <Badge
                variant="outline"
                className="cursor-pointer border-emerald-300 text-emerald-600 dark:border-emerald-700 dark:text-emerald-400"
                onClick={() => setSearchQuery("")}
              >
                &quot;{searchQuery}&quot; ✕
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Timeline */}
      {filteredEntries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-muted/50">
            <Search className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {lang === "ar" ? "لا توجد نتائج" : "No matching entries"}
          </p>
        </div>
      ) : (
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

              {/* Entries with enhanced timeline */}
              <div className="relative ml-4 space-y-2 pl-6">
                {/* Gradient vertical line */}
                <div className="absolute left-0 top-0 h-full w-0.5 bg-gradient-to-b from-emerald-400 to-teal-500 rounded-full" />

                {groupedEntries[dateStr].map((entry) => {
                  const actionCfg = actionConfig[entry.action]
                  const itemCfg = itemTypeConfig[entry.itemType]
                  const ActionIcon = actionCfg.icon
                  const ItemIcon = itemCfg.icon

                  return (
                    <div
                      key={entry.id}
                      className="group relative flex items-start gap-3 rounded-xl border border-border/30 bg-card/60 p-3 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-card/80 hover:shadow-lg hover:shadow-emerald-500/5"
                    >
                      {/* Timeline dot - larger, more colorful */}
                      <div
                        className={cn(
                          "absolute -left-[33px] top-3 flex size-4 items-center justify-center rounded-full ring-2 ring-background shadow-sm",
                          actionCfg.dotColor
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
      )}
    </div>
  )
}

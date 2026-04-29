"use client"

import { useState, useMemo } from "react"
import {
  StickyNote,
  Plus,
  Star,
  Pin,
  PinOff,
  CheckSquare,
  Pencil,
  Trash2,
  Clock,
  LayoutGrid,
  LayoutList,
  Search,
  ArrowUpDown,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { logHistory } from "@/lib/history-log"
import { audioManager } from "@/lib/audio"
import { AnimatedEmptyState } from "@/components/animated-empty-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Helper: format time ago
function formatTimeAgo(dateStr: string, lang: Language): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) return t("justNow", lang)
  if (diffMinutes < 60) return `${diffMinutes}${t("minutesAgo", lang)}`
  if (diffHours < 24) return `${diffHours}${t("hoursAgo", lang)}`
  if (diffDays < 7) return `${diffDays}${t("daysAgo", lang)}`
  return date.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", { month: "short", day: "numeric" })
}

// Helper: generate a very faint gradient from the note color
function getGradientStyle(color: string) {
  return {
    background: `linear-gradient(135deg, ${color}08 0%, ${color}03 50%, transparent 100%)`,
  }
}

// Helper: generate color-tinted shadow
function getColorShadow(color: string) {
  return { boxShadow: `0 4px 14px ${color}15, 0 1px 3px ${color}08` }
}

type ViewMode = "grid" | "list"
type SortBy = "dateUpdated" | "dateCreated" | "title" | "color"

export function NotesView() {
  const { notes, setEditingItem, setActiveModal, fetchNotes } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language
  const searchQuery = useAppStore((s) => s.searchQuery)
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [localSearch, setLocalSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>("dateUpdated")

  const activeNotes = notes.filter((note) => !note.deletedAt)

  // Filter by search (both global and local)
  const filteredNotes = useMemo(() => {
    const query = localSearch || searchQuery
    if (!query) return activeNotes
    return activeNotes.filter(
      (note) =>
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase())
    )
  }, [activeNotes, localSearch, searchQuery])

  // Sort notes
  const sortedNotes = useMemo(() => {
    const pinned = filteredNotes.filter((n) => n.isPinned)
    const other = filteredNotes.filter((n) => !n.isPinned)

    const sortFn = (a: typeof notes[0], b: typeof notes[0]) => {
      switch (sortBy) {
        case "dateCreated":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "title":
          return a.title.localeCompare(b.title, lang === "ar" ? "ar" : "en")
        case "color":
          return (a.color || "").localeCompare(b.color || "")
        case "dateUpdated":
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    }

    // Pinned notes always first, then sorted within their group
    return [...pinned.sort(sortFn), ...other.sort(sortFn)]
  }, [filteredNotes, sortBy, lang])

  const pinnedNotes = sortedNotes.filter((n) => n.isPinned)
  const otherNotes = sortedNotes.filter((n) => !n.isPinned)
  const pinnedCount = activeNotes.filter((n) => n.isPinned).length

  return (
    <div className="space-y-6">
      {/* Header with view mode toggle + sort + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filteredNotes.length} {t("notes", lang).toLowerCase()}
          </span>
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-emerald-200 bg-emerald-50/50 p-0.5 dark:border-emerald-800 dark:bg-emerald-950/30">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                viewMode === "grid"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="size-3.5" />
              {t("gridView", lang)}
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors",
                viewMode === "list"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutList className="size-3.5" />
              {t("listView", lang)}
            </button>
          </div>
          {/* Sort by */}
          <Select
            value={sortBy}
            onValueChange={(val) => setSortBy(val as SortBy)}
          >
            <SelectTrigger size="sm" className="h-8 w-auto gap-1.5 rounded-lg border-emerald-200 bg-emerald-50/50 text-xs dark:border-emerald-800 dark:bg-emerald-950/30">
              <ArrowUpDown className="size-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dateUpdated">{t("sortByDate", lang)}</SelectItem>
              <SelectItem value="dateCreated">{t("dateCreated", lang)}</SelectItem>
              <SelectItem value="title">{t("sortByTitle", lang)}</SelectItem>
              <SelectItem value="color">{t("sortByColor", lang)}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          onClick={() => setActiveModal("addNote")}
          className="gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
        >
          <Plus className="size-3.5" />
          {t("newNote", lang)}
        </Button>
      </div>

      {/* Search/filter bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder={t("searchNotes", lang)}
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="h-9 w-full rounded-xl border border-border/50 bg-muted/30 pl-9 pr-3 text-sm shadow-none transition-colors placeholder:text-muted-foreground/50 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        {localSearch && (
          <button
            onClick={() => setLocalSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <PinOff className="size-3.5" />
          </button>
        )}
      </div>

      {/* Summary Header Card */}
      {activeNotes.length > 0 && (
        <div className={cn(
          "rounded-2xl border border-border/50 p-5 backdrop-blur-sm",
          "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20"
        )}>
          <div className="flex items-center gap-5">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
              <StickyNote className="size-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                {t("notesSummary", lang)}
              </h3>
              <div className="flex items-center gap-4">
                {/* Total notes */}
                <div className="flex items-center gap-2">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40">
                    <StickyNote className="size-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{activeNotes.length}</p>
                    <p className="text-[10px] text-muted-foreground">{t("totalNotes", lang)}</p>
                  </div>
                </div>
                {/* Pinned count */}
                <div className="flex items-center gap-2">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40">
                    <Pin className="size-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{pinnedCount}</p>
                    <p className="text-[10px] text-muted-foreground">{t("pinnedNotes", lang)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pinned notes */}
      {pinnedNotes.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Pin className="size-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-muted-foreground">
              {t("pinned", lang)}
            </span>
            <Badge className="rounded-full border-0 bg-emerald-100 px-1.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
              {pinnedNotes.length}
            </Badge>
          </div>
          <div className={cn(
            viewMode === "grid"
              ? "columns-1 sm:columns-2 lg:columns-3 gap-3 [&>*]:mb-3"
              : "space-y-3"
          )}>
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isPinned
                lang={lang}
                viewMode={viewMode}
                onClick={() => {
                  setEditingItem(note)
                  setActiveModal("editNote")
                }}
                onPinToggle={async (e) => {
                  e.stopPropagation()
                  const newPinned = !note.isPinned
                  try {
                    const res = await fetch(`/api/notes/${note.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ isPinned: newPinned }),
                    })
                    if (res.ok) {
                      toast.success(t(newPinned ? "notePinned" : "noteUnpinned", lang))
                      audioManager.play("click")
                      await logHistory("update", "note", note.id, note.title)
                      fetchNotes()
                    }
                  } catch {
                    // silently fail
                  }
                }}
                onDelete={async (e) => {
                  e.stopPropagation()
                  try {
                    const res = await fetch(`/api/notes/${note.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ deletedAt: new Date().toISOString() }),
                    })
                    if (res.ok) {
                      toast.success(t("noteDeleted", lang))
                      audioManager.play("delete")
                      await logHistory("delete", "note", note.id, note.title)
                      fetchNotes()
                    }
                  } catch {
                    // silently fail
                  }
                }}
                onEdit={(e) => {
                  e.stopPropagation()
                  setEditingItem(note)
                  setActiveModal("editNote")
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other notes */}
      {otherNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <div className="mb-3 flex items-center gap-2">
              <StickyNote className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">
                {lang === "ar" ? "أخرى" : "Other"}
              </span>
            </div>
          )}
          <div className={cn(
            viewMode === "grid"
              ? "columns-1 sm:columns-2 lg:columns-3 gap-3 [&>*]:mb-3"
              : "space-y-3"
          )}>
            {otherNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isPinned={false}
                lang={lang}
                viewMode={viewMode}
                onClick={() => {
                  setEditingItem(note)
                  setActiveModal("editNote")
                }}
                onPinToggle={async (e) => {
                  e.stopPropagation()
                  const newPinned = !note.isPinned
                  try {
                    const res = await fetch(`/api/notes/${note.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ isPinned: newPinned }),
                    })
                    if (res.ok) {
                      toast.success(t(newPinned ? "notePinned" : "noteUnpinned", lang))
                      audioManager.play("click")
                      await logHistory("update", "note", note.id, note.title)
                      fetchNotes()
                    }
                  } catch {
                    // silently fail
                  }
                }}
                onDelete={async (e) => {
                  e.stopPropagation()
                  try {
                    const res = await fetch(`/api/notes/${note.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ deletedAt: new Date().toISOString() }),
                    })
                    if (res.ok) {
                      toast.success(t("noteDeleted", lang))
                      audioManager.play("delete")
                      await logHistory("delete", "note", note.id, note.title)
                      fetchNotes()
                    }
                  } catch {
                    // silently fail
                  }
                }}
                onEdit={(e) => {
                  e.stopPropagation()
                  setEditingItem(note)
                  setActiveModal("editNote")
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {filteredNotes.length === 0 && (
        <AnimatedEmptyState
          icon={StickyNote}
          title={t("noNotes", lang)}
          description={t("noNotesDesc", lang)}
        />
      )}
    </div>
  )
}

function NoteCard({
  note,
  isPinned,
  lang,
  viewMode,
  onClick,
  onPinToggle,
  onDelete,
  onEdit,
}: {
  note: {
    id: string
    title: string
    content: string
    color: string
    isPinned: boolean
    flagged: boolean
    updatedAt: string
    checklist: { id: string; text: string; completed: boolean }[]
  }
  isPinned: boolean
  lang: Language
  viewMode: ViewMode
  onClick: () => void
  onPinToggle: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
  onEdit: (e: React.MouseEvent) => void
}) {
  const completedChecklist = note.checklist.filter((c) => c.completed).length
  const totalChecklist = note.checklist.length
  const checklistProgress = totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0
  const noteColor = note.color || "#10b981"

  return (
    <Card
      className={cn(
        "group cursor-pointer break-inside-avoid overflow-hidden rounded-2xl border transition-all duration-200 animate-fade-in-up backdrop-blur-sm",
        isPinned
          ? "border-amber-200/50 bg-card/90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-500/5 dark:border-amber-700/30"
          : "border-border/50 bg-card/80 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/5",
        viewMode === "list" && "break-inside-auto"
      )}
      style={{
        ...getColorShadow(noteColor),
        borderLeft: `3px solid ${noteColor}`,
      }}
      onClick={onClick}
    >
      <CardContent className="relative p-0">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 rounded-2xl" style={getGradientStyle(noteColor)} />

        <div className="relative flex-1 p-4">
          {/* Pinned badge for pinned notes */}
          {isPinned && (
            <div className="absolute right-2 top-2">
              <Badge className="rounded-full border-0 bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                📌 {t("pinnedNotes", lang)}
              </Badge>
            </div>
          )}

          {/* Header row: title + badges */}
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "line-clamp-1 text-sm font-semibold text-foreground",
              isPinned && "text-base"
            )}>
              {note.title}
            </h4>
            {!isPinned && (
              <div className="flex shrink-0 items-center gap-1">
                {note.isPinned && <Pin className="size-3 text-amber-500" />}
                {note.flagged && <Star className="size-3 text-rose-500" />}
              </div>
            )}
          </div>

          {/* Content preview */}
          {note.content && (
            <p className={cn(
              "mt-2 text-xs leading-relaxed text-muted-foreground",
              isPinned ? "line-clamp-4" : "line-clamp-3"
            )}>
              {note.content}
            </p>
          )}

          {/* Checklist progress */}
          {totalChecklist > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <CheckSquare className="size-3" />
                  <span>{completedChecklist}/{totalChecklist}</span>
                </div>
                <span className="text-[10px] font-medium" style={{ color: noteColor }}>
                  {Math.round(checklistProgress)}%
                </span>
              </div>
              {/* Thin progress bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
                  style={{
                    width: `${checklistProgress}%`,
                    backgroundColor: noteColor,
                  }}
                />
              </div>
            </div>
          )}

          {/* Footer: time ago */}
          <div className="mt-3 flex items-center gap-1 text-[10px] text-muted-foreground/70">
            <Clock className="size-2.5" />
            <span>{formatTimeAgo(note.updatedAt, lang)}</span>
          </div>

          {/* Hover actions */}
          <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onEdit}
              title={t("edit", lang)}
            >
              <Pencil className="size-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onPinToggle}
              title={note.isPinned ? t("noteUnpinned", lang) : t("notePinned", lang)}
            >
              {note.isPinned ? (
                <PinOff className="size-3" />
              ) : (
                <Pin className="size-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
              onClick={onDelete}
              title={t("delete", lang)}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

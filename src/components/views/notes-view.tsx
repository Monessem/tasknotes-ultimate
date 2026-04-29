"use client"

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
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t, type Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { logHistory } from "@/lib/history-log"
import { audioManager } from "@/lib/audio"

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

export function NotesView() {
  const { notes, setEditingItem, setActiveModal, fetchNotes } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language
  const searchQuery = useAppStore((s) => s.searchQuery)

  const activeNotes = notes.filter((note) => !note.deletedAt)

  // Filter by search
  const filteredNotes = searchQuery
    ? activeNotes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : activeNotes

  // Sort: pinned first, then by date
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  const pinnedNotes = sortedNotes.filter((n) => n.isPinned)
  const otherNotes = sortedNotes.filter((n) => !n.isPinned)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {filteredNotes.length} {t("notes", lang).toLowerCase()}
        </span>
        <Button
          size="sm"
          onClick={() => setActiveModal("addNote")}
          className="gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/25 hover:from-amber-600 hover:to-orange-600"
        >
          <Plus className="size-3.5" />
          {t("newNote", lang)}
        </Button>
      </div>

      {/* Pinned notes */}
      {pinnedNotes.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Pin className="size-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-muted-foreground">
              {t("pinned", lang)}
            </span>
          </div>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 [&>*]:mb-3">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isPinned
                lang={lang}
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
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-3 [&>*]:mb-3">
            {otherNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isPinned={false}
                lang={lang}
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
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
            <StickyNote className="size-7 text-amber-500" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            {t("noNotes", lang)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("noNotesDesc", lang)}
          </p>
        </div>
      )}
    </div>
  )
}

function NoteCard({
  note,
  isPinned,
  lang,
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
        "group cursor-pointer break-inside-avoid overflow-hidden rounded-xl border transition-all duration-200",
        isPinned
          ? "border-amber-200/50 bg-card/90 shadow-md shadow-amber-500/5 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10 dark:border-amber-700/30"
          : "border-border/30 bg-card/80 hover:-translate-y-0.5 hover:shadow-lg"
      )}
      onClick={onClick}
    >
      <CardContent className="relative p-0">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 rounded-xl" style={getGradientStyle(noteColor)} />

        {/* Left color border */}
        <div className="flex">
          <div
            className="w-1 shrink-0 self-stretch"
            style={{ backgroundColor: noteColor }}
          />
          <div className="relative flex-1 p-4">
            {/* Header row: title + badges */}
            <div className="flex items-start justify-between gap-2">
              <h4 className={cn(
                "line-clamp-1 text-sm font-semibold text-foreground",
                isPinned && "text-base"
              )}>
                {note.title}
              </h4>
              <div className="flex shrink-0 items-center gap-1">
                {note.isPinned && <Pin className="size-3 text-amber-500" />}
                {note.flagged && <Star className="size-3 text-rose-500" />}
              </div>
            </div>

            {/* Content preview */}
            {note.content && (
              <p className={cn(
                "mt-2 text-xs leading-relaxed text-muted-foreground",
                isPinned ? "line-clamp-4" : "line-clamp-4"
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
                <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-300"
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
        </div>
      </CardContent>
    </Card>
  )
}

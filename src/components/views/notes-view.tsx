"use client"

import {
  StickyNote,
  Plus,
  Star,
  Pin,
  CheckSquare,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function NotesView() {
  const { notes, setEditingItem, setActiveModal } = useAppStore()
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
    <div className="space-y-4">
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
          <div className="mb-2 flex items-center gap-2">
            <Pin className="size-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-muted-foreground">
              {t("pinned", lang)}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pinnedNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => {
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
            <div className="mb-2 flex items-center gap-2">
              <StickyNote className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">
                {lang === "ar" ? "أخرى" : "Other"}
              </span>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => {
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
  onClick,
}: {
  note: {
    id: string
    title: string
    content: string
    color: string
    isPinned: boolean
    flagged: boolean
    checklist: { id: string; text: string; completed: boolean }[]
  }
  onClick: () => void
}) {
  const lang = useAppStore((s) => s.settings.language)
  const completedChecklist = note.checklist.filter((c) => c.completed).length
  const totalChecklist = note.checklist.length

  return (
    <Card
      className="group cursor-pointer rounded-xl border border-border/30 bg-card/80 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Color accent bar */}
        <div
          className="mb-2 h-1 w-8 rounded-full"
          style={{ backgroundColor: note.color || "#10b981" }}
        />
        <div className="flex items-start justify-between gap-2">
          <h4 className="line-clamp-1 text-sm font-semibold text-foreground">
            {note.title}
          </h4>
          <div className="flex shrink-0 items-center gap-1">
            {note.isPinned && <Pin className="size-3 text-amber-500" />}
            {note.flagged && <Star className="size-3 text-rose-500" />}
          </div>
        </div>
        {note.content && (
          <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
            {note.content}
          </p>
        )}
        {totalChecklist > 0 && (
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <CheckSquare className="size-3" />
            <span>
              {completedChecklist}/{totalChecklist}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

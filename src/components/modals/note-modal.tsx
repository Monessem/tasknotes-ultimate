"use client"

import { useState, useEffect, useCallback } from "react"
import { Pin, Plus, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { useAppStore, type Note } from "@/store/app-store"
import { toast } from "sonner"
import { logHistory } from "@/lib/history-log"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const NOTE_COLORS = [
  "#10b981",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#0ea5e9",
  "#8b5cf6",
]

interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export function NoteModal() {
  const {
    activeModal,
    setActiveModal,
    editingItem,
    folders,
    fetchNotes,
    settings,
  } = useAppStore()
  const lang = settings.language

  const isOpen = activeModal === "addNote" || activeModal === "editNote"
  const isEditing = activeModal === "editNote"
  const existingNote = isEditing ? (editingItem as Note | null) : null

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [color, setColor] = useState(NOTE_COLORS[0])
  const [folderId, setFolderId] = useState<string>("none")
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [isPinned, setIsPinned] = useState(false)
  const [newChecklistText, setNewChecklistText] = useState("")
  const [saving, setSaving] = useState(false)

  const resetForm = useCallback(() => {
    if (existingNote) {
      setTitle(existingNote.title)
      setContent(existingNote.content || "")
      setColor(existingNote.color || NOTE_COLORS[0])
      setFolderId(existingNote.folderId || "none")
      setChecklist(
        (existingNote.checklist || []).map((item) => ({
          id: item.id,
          text: item.text,
          completed: item.completed,
        }))
      )
      setIsPinned(existingNote.isPinned || false)
    } else {
      setTitle("")
      setContent("")
      setColor(NOTE_COLORS[0])
      setFolderId("none")
      setChecklist([])
      setIsPinned(false)
    }
    setNewChecklistText("")
    setSaving(false)
  }, [existingNote])

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen, resetForm])

  const handleClose = () => {
    setActiveModal(null)
  }

  const handleSave = async () => {
    if (!title.trim()) return

    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        content,
        color,
        folderId: folderId === "none" ? null : folderId,
        checklist,
        isPinned,
      }

      if (isEditing && existingNote) {
        const res = await fetch(`/api/notes/${existingNote.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to update note")
      } else {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to create note")
      }

      await fetchNotes()
      // Toast and history
      if (isEditing && existingNote) {
        toast.success(t("noteUpdated", lang))
        logHistory("update", "note", existingNote.id, title.trim())
      } else {
        toast.success(t("noteCreated", lang))
      }
      handleClose()
    } catch (err) {
      console.error("Failed to save note:", err)
    } finally {
      setSaving(false)
    }
  }

  const addChecklistItem = () => {
    if (!newChecklistText.trim()) return
    setChecklist([
      ...checklist,
      {
        id: `cl-${Date.now()}`,
        text: newChecklistText.trim(),
        completed: false,
      },
    ])
    setNewChecklistText("")
  }

  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id))
  }

  const toggleChecklistItem = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editNote", lang) : t("newNote", lang)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {t("noteTitle", lang)}
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("noteTitle", lang)}
              className="h-9"
            />
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {t("description", lang)}
            </Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t("noteContentPlaceholder", lang)}
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Color picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {t("habitColor", lang)}
            </Label>
            <div className="flex flex-wrap gap-2">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "size-7 rounded-full border-2 transition-all hover:scale-110",
                    color === c
                      ? "border-foreground ring-2 ring-foreground/20"
                      : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Select color ${c}`}
                >
                  {color === c && (
                    <Check className="mx-auto size-3.5 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Folder select */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {t("folder", lang)}
            </Label>
            <Select value={folderId} onValueChange={setFolderId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("selectFolder", lang)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("noFolder", lang)}</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.icon} {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Checklist section */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {t("checklist", lang)}
            </Label>

            {checklist.length > 0 && (
              <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-lg border border-border/50 p-2">
                {checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                      className="size-3.5"
                    />
                    <span
                      className={cn(
                        "flex-1 text-xs",
                        item.completed && "text-muted-foreground line-through"
                      )}
                    >
                      {item.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5 shrink-0 rounded-md opacity-60 hover:opacity-100"
                      onClick={() => removeChecklistItem(item.id)}
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                placeholder={t("addChecklistItem", lang)}
                className="h-8 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addChecklistItem()
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8 shrink-0 gap-1"
                onClick={addChecklistItem}
                disabled={!newChecklistText.trim()}
              >
                <Plus className="size-3" />
              </Button>
            </div>
          </div>

          {/* Pin toggle */}
          <div className="flex items-center gap-3">
            <Button
              variant={isPinned ? "default" : "outline"}
              size="sm"
              className={cn(
                "gap-1.5",
                isPinned &&
                  "bg-amber-500 text-white hover:bg-amber-600"
              )}
              onClick={() => setIsPinned(!isPinned)}
            >
              <Pin className={cn("size-3.5", isPinned && "rotate-45")} />
              {t("pinned", lang)}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("cancel", lang)}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || saving}
            className="gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
          >
            {saving ? (
              <div className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <Check className="size-3.5" />
            )}
            {t("save", lang)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

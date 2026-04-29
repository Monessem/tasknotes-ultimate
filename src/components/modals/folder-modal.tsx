"use client"

import { useState, useEffect, useCallback } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { useAppStore, type Folder } from "@/store/app-store"
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
import { Label } from "@/components/ui/label"

const FOLDER_ICONS = [
  "📁", "📂", "🗂️", "📋", "📌", "📎", "🏷️", "🔖",
  "💼", "🎓", "🏠", "💻", "🎨", "📊", "🎯", "⭐",
  "❤️", "🛒", "🎮", "📱", "🔧", "🌍", "🎵", "📸",
]

const FOLDER_COLORS = [
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

export function FolderModal() {
  const { activeModal, setActiveModal, editingItem, fetchFolders, settings } =
    useAppStore()
  const lang = settings.language

  const isOpen = activeModal === "addFolder" || activeModal === "editFolder"
  const isEditing = activeModal === "editFolder"
  const existingFolder = isEditing ? (editingItem as Folder | null) : null

  const [name, setName] = useState("")
  const [icon, setIcon] = useState("📁")
  const [color, setColor] = useState(FOLDER_COLORS[0])
  const [saving, setSaving] = useState(false)

  const resetForm = useCallback(() => {
    if (existingFolder) {
      setName(existingFolder.name)
      setIcon(existingFolder.icon || "📁")
      setColor(existingFolder.color || FOLDER_COLORS[0])
    } else {
      setName("")
      setIcon("📁")
      setColor(FOLDER_COLORS[0])
    }
    setSaving(false)
  }, [existingFolder])

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen, resetForm])

  const handleClose = () => {
    setActiveModal(null)
  }

  const handleSave = async () => {
    if (!name.trim()) return

    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        icon,
        color,
      }

      if (isEditing && existingFolder) {
        const res = await fetch(`/api/folders/${existingFolder.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to update folder")
      } else {
        const res = await fetch("/api/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to create folder")
      }

      await fetchFolders()
      // Toast and history
      if (isEditing && existingFolder) {
        toast.success(t("folderUpdated", lang))
        logHistory("update", "folder", existingFolder.id, name.trim())
      } else {
        toast.success(t("folderCreated", lang))
      }
      handleClose()
    } catch (err) {
      console.error("Failed to save folder:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editFolder", lang) : t("newFolder", lang)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {t("folderName", lang)}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("folderNamePlaceholder", lang)}
              className="h-9"
            />
          </div>

          {/* Icon selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {t("habitIcon", lang)}
            </Label>
            <div className="flex flex-wrap gap-1.5 rounded-lg border border-border/50 p-2">
              {FOLDER_ICONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg text-base transition-all hover:scale-110",
                    icon === emoji
                      ? "bg-emerald-500/10 ring-2 ring-emerald-500/50"
                      : "hover:bg-muted"
                  )}
                  onClick={() => setIcon(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {t("folderColor", lang)}
            </Label>
            <div className="flex flex-wrap gap-2">
              {FOLDER_COLORS.map((c) => (
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("cancel", lang)}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!name.trim() || saving}
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

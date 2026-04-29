"use client"

import { useState, useEffect, useCallback } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { t } from "@/lib/i18n"
import { useAppStore, type Habit } from "@/store/app-store"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const HABIT_ICONS = [
  "🎯", "📚", "💪", "🧘", "🏃", "💧", "🥗", "😴",
  "✍️", "🎵", "🌿", "💊", "🧹", "📝", "⏰", "🚶",
  "🍎", "🧠", "🎨", "🏋️", "🚴", "🏊", "🙏", "📱",
]

const HABIT_COLORS = [
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

export function HabitModal() {
  const { activeModal, setActiveModal, editingItem, fetchHabits, settings } =
    useAppStore()
  const lang = settings.language

  const isOpen = activeModal === "addHabit" || activeModal === "editHabit"
  const isEditing = activeModal === "editHabit"
  const existingHabit = isEditing ? (editingItem as Habit | null) : null

  const [name, setName] = useState("")
  const [icon, setIcon] = useState("🎯")
  const [color, setColor] = useState(HABIT_COLORS[0])
  const [frequency, setFrequency] = useState("daily")
  const [goal, setGoal] = useState(30)
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const resetForm = useCallback(() => {
    if (existingHabit) {
      setName(existingHabit.name)
      setIcon(existingHabit.icon || "🎯")
      setColor(existingHabit.color || HABIT_COLORS[0])
      setFrequency(existingHabit.frequency || "daily")
      setGoal(existingHabit.goal || 30)
      setNotes(existingHabit.notes || "")
    } else {
      setName("")
      setIcon("🎯")
      setColor(HABIT_COLORS[0])
      setFrequency("daily")
      setGoal(30)
      setNotes("")
    }
    setSaving(false)
  }, [existingHabit])

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
        frequency,
        goal,
        notes,
      }

      if (isEditing && existingHabit) {
        const res = await fetch(`/api/habits/${existingHabit.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to update habit")
      } else {
        const res = await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error("Failed to create habit")
      }

      await fetchHabits()
      // Toast and history
      if (isEditing && existingHabit) {
        toast.success(t("habitUpdated", lang))
        logHistory("update", "habit", existingHabit.id, name.trim())
      } else {
        toast.success(t("habitCreated", lang))
      }
      handleClose()
    } catch (err) {
      console.error("Failed to save habit:", err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editHabit", lang) : t("newHabit", lang)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {t("habitName", lang)}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("habitNamePlaceholder", lang)}
              className="h-9"
            />
          </div>

          {/* Icon selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {t("habitIcon", lang)}
            </Label>
            <div className="flex flex-wrap gap-1.5 rounded-lg border border-border/50 p-2">
              {HABIT_ICONS.map((emoji) => (
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
              {t("habitColor", lang)}
            </Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c) => (
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

          {/* Frequency */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {t("recurring", lang)}
            </Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">{t("daily", lang)}</SelectItem>
                <SelectItem value="weekly">{t("weekly", lang)}</SelectItem>
                <SelectItem value="weekdays">Weekdays</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Goal */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {t("workDuration", lang)} ({t("minutes", lang)})
            </Label>
            <Input
              type="number"
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value) || 0)}
              min={0}
              className="h-9"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              {t("description", lang)}
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("descriptionPlaceholder", lang)}
              rows={3}
              className="resize-none"
            />
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

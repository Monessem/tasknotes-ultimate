"use client"

import { useState, useEffect, useCallback } from "react"
import { useAppStore, type Todo } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { logHistory } from "@/lib/history-log"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Star,
  Flag,
  X,
  Plus,
  ListChecks,
  CalendarDays,
} from "lucide-react"

interface Subtask {
  id: string
  title: string
  completed: boolean
}

export function TodoModal() {
  const {
    activeModal,
    setActiveModal,
    editingItem,
    fetchTodos,
    folders,
    settings,
  } = useAppStore()
  const lang = settings.language

  const isOpen = activeModal === "addTodo" || activeModal === "editTodo"
  const isEditing = activeModal === "editTodo"
  const editTodo = isEditing ? (editingItem as Todo | null) : null

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"high" | "medium" | "low" | "">("")
  const [dueDate, setDueDate] = useState("")
  const [folderId, setFolderId] = useState<string>("none")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [subtaskInput, setSubtaskInput] = useState("")
  const [recurring, setRecurring] = useState<string>("none")
  const [important, setImportant] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editTodo) {
        setTitle(editTodo.title || "")
        setDescription(editTodo.description || "")
        setPriority(editTodo.priority || "")
        setDueDate(
          editTodo.dueDate
            ? toLocalDateTimeString(editTodo.dueDate)
            : ""
        )
        setFolderId(editTodo.folderId || "none")
        setTags(editTodo.tags ? [...editTodo.tags] : [])
        setSubtasks(
          editTodo.subtasks
            ? editTodo.subtasks.map((s) => ({
                id: s.id || crypto.randomUUID(),
                title: s.title,
                completed: s.completed,
              }))
            : []
        )
        setRecurring(editTodo.recurring || "none")
        setImportant(editTodo.important || false)
      } else {
        setTitle("")
        setDescription("")
        setPriority("")
        setDueDate("")
        setFolderId("none")
        setTags([])
        setSubtasks([])
        setSubtaskInput("")
        setRecurring("none")
        setImportant(false)
      }
      setTagInput("")
      setIsSaving(false)
    }
  }, [isOpen, editTodo])

  function toLocalDateTimeString(dateStr: string): string {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return ""
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  function handleAddTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      const tag = tagInput.trim().replace(/^#/, "")
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag])
      }
      setTagInput("")
    }
  }

  function handleRemoveTag(index: number) {
    setTags(tags.filter((_, i) => i !== index))
  }

  function handleAddSubtask() {
    const taskTitle = subtaskInput.trim()
    if (!taskTitle) return
    setSubtasks([
      ...subtasks,
      { id: crypto.randomUUID(), title: taskTitle, completed: false },
    ])
    setSubtaskInput("")
  }

  function handleSubtaskKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddSubtask()
    }
  }

  function handleToggleSubtask(index: number) {
    setSubtasks(
      subtasks.map((s, i) =>
        i === index ? { ...s, completed: !s.completed } : s
      )
    )
  }

  function handleRemoveSubtask(index: number) {
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  function handleSetDueToday() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    setDueDate(`${year}-${month}-${day}T${hours}:${minutes}`)
  }

  async function handleSave() {
    if (!title.trim()) return

    setIsSaving(true)

    let dueDateISO: string | null = null
    if (dueDate) {
      const localDate = new Date(dueDate)
      if (!isNaN(localDate.getTime())) {
        dueDateISO = localDate.toISOString()
      }
    }

    const todoData = {
      title: title.trim(),
      description: description.trim(),
      priority: priority || null,
      dueDate: dueDateISO,
      folderId: folderId === "none" ? null : folderId,
      tags,
      subtasks: subtasks.map((s) => ({
        id: s.id,
        title: s.title,
        completed: s.completed,
      })),
      recurring: recurring === "none" ? null : recurring,
      important,
    }

    try {
      let res: Response
      if (isEditing && editTodo) {
        res = await fetch(`/api/todos/${editTodo.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(todoData),
        })
      } else {
        res = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(todoData),
        })
      }

      if (res.ok) {
        const result = await res.json()
        await fetchTodos()
        // Toast and history
        if (isEditing && editTodo) {
          toast.success(t("taskUpdated", lang))
          logHistory("update", "task", editTodo.id, title.trim())
        } else {
          toast.success(t("taskCreated", lang))
          logHistory("create", "task", result.id, title.trim())
        }
        setActiveModal(null)
      }
    } catch (e) {
      console.error("Failed to save todo:", e)
    } finally {
      setIsSaving(false)
    }
  }

  function handleClose() {
    setActiveModal(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editTask", lang) : t("newTask", lang)}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEditing ? t("editTask", lang) : t("newTask", lang)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="todo-title">{t("taskTitle", lang)} *</Label>
            <Input
              id="todo-title"
              placeholder={t("taskTitlePlaceholder", lang)}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="todo-desc">{t("description", lang)}</Label>
            <Textarea
              id="todo-desc"
              placeholder={t("descriptionPlaceholder", lang)}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={3}
            />
          </div>

          {/* Priority & Folder */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("priority", lang)}</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as typeof priority)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("priority", lang)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-rose-500" />
                      {t("high", lang)}
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-amber-500" />
                      {t("medium", lang)}
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="size-2 rounded-full bg-emerald-500" />
                      {t("low", lang)}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("folder", lang)}</Label>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("selectFolder", lang)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noFolder", lang)}</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      <div className="flex items-center gap-2">
                        <span>{f.icon}</span>
                        <span>{f.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date & Recurring */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("dueDate", lang)}</Label>
              <div className="flex gap-2">
                <Input
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSetDueToday}
                  className="shrink-0 whitespace-nowrap"
                >
                  <CalendarDays className="size-3.5" />
                  <span className="hidden sm:inline">{t("today", lang)}</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("recurring", lang)}</Label>
              <Select value={recurring} onValueChange={setRecurring}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("recurring", lang)} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("noRecurring", lang)}</SelectItem>
                  <SelectItem value="daily">{t("daily", lang)}</SelectItem>
                  <SelectItem value="weekly">{t("weekly", lang)}</SelectItem>
                  <SelectItem value="monthly">{t("monthly", lang)}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>{t("tags", lang)}</Label>
            <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-transparent px-3 py-2">
              {tags.map((tag, i) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 pr-1 text-xs"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(i)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                  >
                    <X className="size-2.5" />
                  </button>
                </Badge>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder={t("tagsPlaceholder", lang)}
                className="min-w-[80px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Subtasks */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ListChecks className="size-4" />
              {t("subtasks", lang)}
            </Label>

            {subtasks.length > 0 && (
              <div className="space-y-1.5">
                {subtasks.map((subtask, i) => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 rounded-lg border border-border/30 bg-muted/20 px-3 py-2"
                  >
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => handleToggleSubtask(i)}
                      className={cn(
                        "size-4 rounded",
                        subtask.completed &&
                          "border-emerald-500 bg-emerald-500 text-white"
                      )}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        subtask.completed
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      )}
                    >
                      {subtask.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(i)}
                      className="rounded p-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={handleSubtaskKeyDown}
                placeholder={t("subtaskPlaceholder", lang)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddSubtask}
                className="shrink-0"
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Important checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="todo-important"
              checked={important}
              onCheckedChange={(checked) => setImportant(checked === true)}
              className="size-4 rounded"
            />
            <Label
              htmlFor="todo-important"
              className="flex cursor-pointer items-center gap-1.5 text-sm"
            >
              <Star className="size-3.5 text-amber-500" />
              {t("important", lang)}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("cancel", lang)}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            {isSaving ? (
              <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : isEditing ? (
              t("save", lang)
            ) : (
              t("add", lang)
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

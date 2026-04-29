"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Sun,
  Briefcase,
  BookOpen,
  Dumbbell,
  Home,
  Target,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Trash2,
  X,
} from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { t } from "@/lib/i18n"
import { audioManager } from "@/lib/audio"
import { logHistory } from "@/lib/history-log"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import type { Language } from "@/lib/i18n"

interface TemplateTask {
  title: string
}

interface Template {
  id: string
  icon: React.ElementType
  iconBg: string
  nameKey: string
  descKey: string
  tasks: TemplateTask[]
  color: string
}

const TEMPLATES: Template[] = [
  {
    id: "morning",
    icon: Sun,
    iconBg: "from-amber-400 to-orange-500",
    nameKey: "morningRoutine",
    descKey: "morningRoutineDesc",
    color: "amber",
    tasks: [
      { title: "Wake up" },
      { title: "Exercise" },
      { title: "Shower" },
      { title: "Breakfast" },
      { title: "Review goals" },
      { title: "Plan day" },
    ],
  },
  {
    id: "work",
    icon: Briefcase,
    iconBg: "from-emerald-400 to-teal-500",
    nameKey: "workSprint",
    descKey: "workSprintDesc",
    color: "emerald",
    tasks: [
      { title: "Check emails" },
      { title: "Priority task 1" },
      { title: "Team standup" },
      { title: "Deep work block" },
      { title: "Review progress" },
    ],
  },
  {
    id: "study",
    icon: BookOpen,
    iconBg: "from-violet-400 to-purple-500",
    nameKey: "studySession",
    descKey: "studySessionDesc",
    color: "violet",
    tasks: [
      { title: "Review notes" },
      { title: "Read chapter" },
      { title: "Take notes" },
      { title: "Practice problems" },
      { title: "Summarize" },
    ],
  },
  {
    id: "fitness",
    icon: Dumbbell,
    iconBg: "from-rose-400 to-pink-500",
    nameKey: "fitnessPlan",
    descKey: "fitnessPlanDesc",
    color: "rose",
    tasks: [
      { title: "Warm up" },
      { title: "Main workout" },
      { title: "Cool down" },
      { title: "Log progress" },
    ],
  },
  {
    id: "home",
    icon: Home,
    iconBg: "from-cyan-400 to-teal-500",
    nameKey: "homeOrganization",
    descKey: "homeOrganizationDesc",
    color: "cyan",
    tasks: [
      { title: "Declutter desk" },
      { title: "Clean kitchen" },
      { title: "Organize files" },
      { title: "Take out trash" },
      { title: "Plan meals" },
    ],
  },
  {
    id: "goals",
    icon: Target,
    iconBg: "from-emerald-400 to-cyan-500",
    nameKey: "goalSetting",
    descKey: "goalSettingDesc",
    color: "emerald",
    tasks: [
      { title: "Review long-term goals" },
      { title: "Set weekly targets" },
      { title: "Break down tasks" },
      { title: "Track progress" },
    ],
  },
]

// Color mapping for template cards
const templateCardColors: Record<string, string> = {
  amber: "bg-amber-500/5 hover:bg-amber-500/10 border-amber-200/50 dark:border-amber-800/30",
  emerald: "bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-800/30",
  violet: "bg-violet-500/5 hover:bg-violet-500/10 border-violet-200/50 dark:border-violet-800/30",
  rose: "bg-rose-500/5 hover:bg-rose-500/10 border-rose-200/50 dark:border-rose-800/30",
  cyan: "bg-cyan-500/5 hover:bg-cyan-500/10 border-cyan-200/50 dark:border-cyan-800/30",
  custom: "bg-teal-500/5 hover:bg-teal-500/10 border-teal-200/50 dark:border-teal-800/30",
}

interface TaskTemplatesProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TaskTemplates({ open, onOpenChange }: TaskTemplatesProps) {
  const { fetchTodos } = useAppStore()
  const settings = useAppStore((s) => s.settings)
  const lang = settings.language as Language

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customTasks, setCustomTasks] = useState<string[]>([""])
  const [customExpanded, setCustomExpanded] = useState(false)

  const handleApplyTemplate = async (template: Template) => {
    setApplyingId(template.id)
    let createdCount = 0

    for (const task of template.tasks) {
      try {
        const res = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            priority: "medium",
          }),
        })
        if (res.ok) {
          const newTodo = await res.json()
          logHistory("create", "task", newTodo.id, task.title)
          createdCount++
        }
      } catch {
        // Silently continue
      }
    }

    if (createdCount > 0) {
      audioManager.play("complete")
      await fetchTodos()
      toast.success(
        `${createdCount} ${t("templateApplied", lang)}`,
        {
          description: t(template.nameKey, lang),
        }
      )
    }

    setApplyingId(null)
    onOpenChange(false)
  }

  const handleApplyCustom = async () => {
    const validTasks = customTasks.filter((t) => t.trim() !== "")
    if (validTasks.length === 0) return

    setApplyingId("custom")
    let createdCount = 0

    for (const taskTitle of validTasks) {
      try {
        const res = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: taskTitle.trim(),
            priority: "medium",
          }),
        })
        if (res.ok) {
          const newTodo = await res.json()
          logHistory("create", "task", newTodo.id, taskTitle.trim())
          createdCount++
        }
      } catch {
        // Silently continue
      }
    }

    if (createdCount > 0) {
      audioManager.play("complete")
      await fetchTodos()
      toast.success(
        `${createdCount} ${t("templateApplied", lang)}`,
        {
          description: customName || t("customTemplate", lang),
        }
      )
    }

    setApplyingId(null)
    // Reset custom template state
    setCustomName("")
    setCustomTasks([""])
    setShowCustom(false)
    setCustomExpanded(false)
    onOpenChange(false)
  }

  const addCustomTaskField = () => {
    setCustomTasks([...customTasks, ""])
  }

  const updateCustomTask = (index: number, value: string) => {
    const updated = [...customTasks]
    updated[index] = value
    setCustomTasks(updated)
  }

  const removeCustomTask = (index: number) => {
    if (customTasks.length <= 1) return
    setCustomTasks(customTasks.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 sm:max-w-2xl">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm">
              <Sparkles className="size-4" />
            </div>
            {t("taskTemplates", lang)}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t("taskTemplatesDesc", lang)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2">
          {/* Template Grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {TEMPLATES.map((template, index) => {
              const Icon = template.icon
              const isExpanded = expandedId === template.id
              const isApplying = applyingId === template.id

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                >
                  <div
                    className={`group relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${templateCardColors[template.color]}`}
                  >
                    {/* Card content */}
                    <div
                      className="cursor-pointer p-4"
                      onClick={() => setExpandedId(isExpanded ? null : template.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${template.iconBg} text-white shadow-sm`}>
                          <Icon className="size-5" />
                        </div>
                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="truncate text-sm font-semibold text-foreground">
                              {t(template.nameKey, lang)}
                            </h4>
                            <Badge
                              variant="secondary"
                              className="shrink-0 text-[10px] font-medium"
                            >
                              {template.tasks.length} {t("taskCount", lang)}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            {t(template.descKey, lang)}
                          </p>
                        </div>
                      </div>

                      {/* Expand indicator */}
                      <div className="mt-2 flex items-center justify-center">
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="size-3.5 text-muted-foreground/60" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Expanded task preview */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-border/30 px-4 pb-4 pt-3">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              {t("previewTasks", lang)}
                            </p>
                            <div className="space-y-1.5">
                              {template.tasks.map((task, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-2 rounded-lg bg-muted/30 px-2.5 py-1.5"
                                >
                                  <div className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
                                  <span className="text-xs text-foreground/80">{task.title}</span>
                                </div>
                              ))}
                            </div>
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleApplyTemplate(template)
                              }}
                              disabled={isApplying}
                              className="mt-3 w-full gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
                            >
                              {isApplying ? (
                                <div className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                              ) : (
                                <CheckCircle2 className="size-3.5" />
                              )}
                              {isApplying ? "..." : t("applyTemplate", lang)}
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Custom Template Section */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.35 }}
            className="mt-4"
          >
            <div
              className={`group relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${templateCardColors.custom}`}
            >
              <div
                className="cursor-pointer p-4"
                onClick={() => {
                  setShowCustom(!showCustom)
                  setCustomExpanded(!showCustom)
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-white shadow-sm">
                    <Plus className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="truncate text-sm font-semibold text-foreground">
                        {t("customTemplate", lang)}
                      </h4>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-[10px] font-medium"
                      >
                        {t("customTemplateDesc", lang)}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {t("customTemplateDesc", lang)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: customExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="size-3.5 text-muted-foreground/60" />
                  </motion.div>
                </div>
              </div>

              {/* Custom template form */}
              <AnimatePresence>
                {showCustom && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border/30 px-4 pb-4 pt-3">
                      {/* Template name */}
                      <div className="mb-3">
                        <Input
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                          placeholder={t("templateNamePlaceholder", lang)}
                          className="h-9 rounded-lg border-emerald-200 bg-emerald-50/50 text-sm dark:border-emerald-800 dark:bg-emerald-950/30"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* Task inputs */}
                      <div className="space-y-2">
                        {customTasks.map((task, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
                            <Input
                              value={task}
                              onChange={(e) => updateCustomTask(i, e.target.value)}
                              placeholder={`${t("addTaskToTemplate", lang)}`}
                              className="h-8 flex-1 rounded-lg border-border/50 bg-muted/30 text-xs"
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.stopPropagation()
                                  addCustomTaskField()
                                }
                              }}
                            />
                            {customTasks.length > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeCustomTask(i)
                                }}
                                className="shrink-0 rounded-md p-1 text-muted-foreground/40 transition-colors hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/30"
                              >
                                <X className="size-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add task button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          addCustomTaskField()
                        }}
                        className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-emerald-600 transition-colors hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
                      >
                        <Plus className="size-3" />
                        {t("addTaskToTemplate", lang)}
                      </button>

                      {/* Apply button */}
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleApplyCustom()
                        }}
                        disabled={
                          applyingId === "custom" ||
                          customTasks.filter((t) => t.trim() !== "").length === 0
                        }
                        className="mt-3 w-full gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 hover:from-emerald-600 hover:to-teal-700"
                      >
                        {applyingId === "custom" ? (
                          <div className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                        {applyingId === "custom" ? "..." : t("applyTemplate", lang)}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

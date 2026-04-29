"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { useAppStore, type ViewType } from "@/store/app-store"
import { AppSidebar } from "@/components/sidebar"
import { AppHeader } from "@/components/app-header"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { TodosView } from "@/components/views/todos-view"
import { ImportantView } from "@/components/views/important-view"
import { TodayView } from "@/components/views/today-view"
import { FlaggedView } from "@/components/views/flagged-view"
import { NotesView } from "@/components/views/notes-view"
import { HabitsView } from "@/components/views/habits-view"
import { FoldersView } from "@/components/views/folders-view"
import { SettingsView } from "@/components/views/settings-view"
import { RecycleView } from "@/components/views/recycle-view"
import { HistoryView } from "@/components/views/history-view"
import { FolderDetailView } from "@/components/views/folder-detail-view"
import { AchievementsView } from "@/components/views/achievements-view"
import { TodoModal } from "@/components/modals/todo-modal"
import { NoteModal } from "@/components/modals/note-modal"
import { HabitModal } from "@/components/modals/habit-modal"
import { FolderModal } from "@/components/modals/folder-modal"
import { ConfirmModal } from "@/components/modals/confirm-modal"
import { InstallPrompt } from "@/components/install-prompt"
import { PageTransition } from "@/components/page-transition"
import { CommandPalette } from "@/components/command-palette"
import { AnimatedEmptyState } from "@/components/animated-empty-state"
import { CheckSquare, Star, Flag, ListTodo, CircleCheckBig, Target, TrendingUp } from "lucide-react"
import { WeeklyTaskChart } from "@/components/weekly-task-chart"
import { HabitCompletionChart } from "@/components/habit-completion-chart"
import { t } from "@/lib/i18n"
import { audioManager } from "@/lib/audio"
import { staggerContainer, staggerItem } from "@/lib/animations"
import type { Language } from "@/lib/i18n"

function getGreeting(lang: Language): string {
  const hour = new Date().getHours()
  if (lang === "ar") {
    if (hour < 12) return "صباح الخير ☀️"
    if (hour < 17) return "مساء الخير 🌤️"
    return "مساء الخير 🌙"
  }
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

// Dashboard view
function DashboardView() {
  const { todos, notes, habits, pomodoroSessions, settings } = useAppStore()
  const lang = settings.language

  const activeTodos = todos.filter((t) => !t.completed && !t.deletedAt)
  const completedTodos = todos.filter((t) => t.completed && !t.deletedAt)
  const completionRate = todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0
  const todayStr = new Date().toISOString().split("T")[0]
  const todaySessions = pomodoroSessions.filter((s) => s.date === todayStr && s.type === "work").length
  const focusMinutes = pomodoroSessions
    .filter((s) => s.date === todayStr && s.type === "work")
    .reduce((acc, s) => acc + s.duration, 0)

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="mb-2">
        <h2 className="text-2xl font-extrabold text-foreground">
          {getGreeting(lang)}
        </h2>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats row */}
      <motion.div
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={staggerItem}>
          <StatCard
            label={t("totalTasks", lang)}
            value={activeTodos.length}
            gradient="from-emerald-500 to-teal-600"
            bgGradient="from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40"
            icon={ListTodo}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label={t("completed", lang)}
            value={completedTodos.length}
            gradient="from-amber-500 to-orange-500"
            bgGradient="from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40"
            icon={CircleCheckBig}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label={t("todayHabits", lang)}
            value={habits.filter((h) => !h.deletedAt).length}
            gradient="from-rose-500 to-pink-500"
            bgGradient="from-rose-100 to-pink-100 dark:from-rose-900/40 dark:to-pink-900/40"
            icon={Target}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            label={t("completionRate", lang)}
            value={`${completionRate}%`}
            gradient="from-cyan-500 to-teal-500"
            bgGradient="from-cyan-100 to-teal-100 dark:from-cyan-900/40 dark:to-teal-900/40"
            icon={TrendingUp}
          />
        </motion.div>
      </motion.div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pomodoro Timer */}
        <div className="lg:col-span-1">
          <PomodoroTimer />
        </div>

        {/* Recent tasks */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm">
            <h3 className="mb-4 text-base font-bold text-foreground">
              {t("todos", lang)}
            </h3>
            {activeTodos.length === 0 ? (
              <AnimatedEmptyState
                icon={CheckSquare}
                title={t("noTasks", lang)}
                description={t("noTasksDesc", lang)}
              />
            ) : (
              <div className="space-y-2">
                {activeTodos.slice(0, 5).map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div
                      className={cn_priority(
                        todo.priority,
                        "size-2.5 rounded-full"
                      )}
                    />
                    <span className="flex-1 truncate text-sm font-medium text-foreground">
                      {todo.title}
                    </span>
                    {todo.important && (
                      <Star className="size-3.5 text-amber-500" />
                    )}
                    {todo.flagged && (
                      <Flag className="size-3.5 text-rose-500" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="mt-6">
        <WeeklyTaskChart />
      </div>

      {/* Habit Completion */}
      <div className="mt-6">
        <HabitCompletionChart />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  gradient,
  bgGradient,
  icon: Icon,
}: {
  label: string
  value: number | string
  gradient: string
  bgGradient: string
  icon: React.ElementType
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className={cn_absolute_bar(gradient)} />
      <div
        className={`mb-3 flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${bgGradient}`}
      >
        <Icon className="size-5 text-foreground/70" />
      </div>
      <p className="text-2xl font-extrabold text-foreground">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  )
}

function cn_priority(priority: string, base: string) {
  const colors: Record<string, string> = {
    high: "bg-rose-500",
    medium: "bg-amber-500",
    low: "bg-emerald-500",
  }
  return `${base} ${colors[priority] || colors.medium}`
}

function cn_absolute_bar(gradient: string) {
  return `absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`
}

export function AppShell() {
  const { currentView, fetchAllData, isLoading, settings } = useAppStore()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  // Sync soundEnabled setting with audio manager
  useEffect(() => {
    audioManager.setEnabled(settings.soundEnabled)
  }, [settings.soundEnabled])

  const handleSelectFolder = useCallback((folderId: string) => {
    setSelectedFolderId(folderId)
  }, [])

  const handleBackToFolders = useCallback(() => {
    setSelectedFolderId(null)
  }, [])

  // Clear selected folder when not on folders view
  const effectiveFolderId = currentView === "folders" ? selectedFolderId : null

  // Determine which view to render
  const renderView = () => {
    // Folder detail takes priority when a folder is selected
    if (currentView === "folders" && effectiveFolderId) {
      return <FolderDetailView folderId={selectedFolderId} onBack={handleBackToFolders} />
    }

    switch (currentView) {
      case "dashboard":
        return <DashboardView />
      case "todos":
        return <TodosView />
      case "notes":
        return <NotesView />
      case "habits":
        return <HabitsView />
      case "important":
        return <ImportantView />
      case "today":
        return <TodayView />
      case "flagged":
        return <FlaggedView />
      case "history":
        return <HistoryView />
      case "folders":
        return <FoldersView onSelectFolder={handleSelectFolder} />
      case "recycle":
        return <RecycleView />
      case "achievements":
        return <AchievementsView />
      case "settings":
        return <SettingsView />
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <AppSidebar />

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        <AppHeader />
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="flex flex-col items-center gap-4">
                <div className="size-12 animate-spin rounded-2xl border-4 border-muted border-t-emerald-500" />
                <p className="text-sm font-medium text-muted-foreground">
                  Loading...
                </p>
              </div>
            </div>
          ) : (
            <PageTransition viewKey={currentView}>
              {renderView()}
            </PageTransition>
          )}
        </div>
      </main>

      {/* Modals */}
      <TodoModal />
      <NoteModal />
      <HabitModal />
      <FolderModal />
      <InstallPrompt />
      <CommandPalette />
    </div>
  )
}

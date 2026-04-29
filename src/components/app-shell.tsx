"use client"

import { useEffect, useState, useCallback } from "react"
import { useAppStore } from "@/store/app-store"
import { AppSidebar } from "@/components/sidebar"
import { AppHeader } from "@/components/app-header"
import { TodosView } from "@/components/views/todos-view"
import { ImportantView } from "@/components/views/important-view"
import { TodayView } from "@/components/views/today-view"
import { CalendarView } from "@/components/views/calendar-view"
import { FlaggedView } from "@/components/views/flagged-view"
import { NotesView } from "@/components/views/notes-view"
import { HabitsView } from "@/components/views/habits-view"
import { FoldersView } from "@/components/views/folders-view"
import { SettingsView } from "@/components/views/settings-view"
import { RecycleView } from "@/components/views/recycle-view"
import { HistoryView } from "@/components/views/history-view"
import { FolderDetailView } from "@/components/views/folder-detail-view"
import { AchievementsView } from "@/components/views/achievements-view"
import { FocusView } from "@/components/views/focus-view"
import { DashboardView } from "@/components/views/dashboard-view"
import { TodoModal } from "@/components/modals/todo-modal"
import { NoteModal } from "@/components/modals/note-modal"
import { HabitModal } from "@/components/modals/habit-modal"
import { FolderModal } from "@/components/modals/folder-modal"
import { InstallPrompt } from "@/components/install-prompt"
import { PageTransition } from "@/components/page-transition"
import { CommandPalette } from "@/components/command-palette"
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog"
import { NotificationManager } from "@/components/notification-manager"
import { SmartFAB } from "@/components/smart-fab"
import { audioManager } from "@/lib/audio"

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
      case "calendar":
        return <CalendarView />
      case "focus":
        return <FocusView />
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
      <KeyboardShortcutsDialog />
      <NotificationManager />
      <SmartFAB />
    </div>
  )
}

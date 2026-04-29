"use client"

import { useEffect, useRef } from "react"
import { useAppStore } from "@/store/app-store"
import { requestNotificationPermission, checkDueTasks } from "@/lib/notifications"

/**
 * This component runs in the background to manage browser notifications.
 * It requests permission on mount and checks for due tasks periodically.
 * Render it once in the app shell (invisible component).
 */
export function NotificationManager() {
  const { todos, settings } = useAppStore()
  const hasCheckedRef = useRef(false)

  // Request permission on mount if reminders are enabled
  useEffect(() => {
    if (settings.taskReminders) {
      requestNotificationPermission()
    }
  }, [settings.taskReminders])

  // Check for due tasks when data loads (once per session)
  useEffect(() => {
    if (settings.taskReminders && todos.length > 0 && !hasCheckedRef.current) {
      hasCheckedRef.current = true
      // Delay to avoid notification on page load
      const timer = setTimeout(() => {
        checkDueTasks(todos, settings.language)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [settings.taskReminders, todos, settings.language])

  // Periodic check every 30 minutes
  useEffect(() => {
    if (!settings.taskReminders) return

    const interval = setInterval(() => {
      checkDueTasks(todos, settings.language)
    }, 30 * 60 * 1000) // 30 minutes

    return () => clearInterval(interval)
  }, [settings.taskReminders, todos, settings.language])

  return null // Invisible component
}

// Browser Notification API integration
// - Request notification permission
// - Show notification for due tasks
// - Check for due/overdue tasks periodically
// - Respect settings.taskReminders flag

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false
  if (Notification.permission === "granted") return true
  if (Notification.permission === "denied") return false
  const result = await Notification.requestPermission()
  return result === "granted"
}

export function showNotification(title: string, options?: NotificationOptions): void {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return
  new Notification(title, {
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    ...options,
  })
}

export function checkDueTasks(
  todos: Array<{
    id: string
    title: string
    dueDate: string | null
    completed: boolean
    deletedAt: string | null
  }>,
  lang: string = "en"
): void {
  const todayStr = new Date().toISOString().split("T")[0]

  // Find tasks due today that are not completed
  const dueTasks = todos.filter(
    (t) => !t.completed && !t.deletedAt && t.dueDate && t.dueDate === todayStr
  )

  if (dueTasks.length > 0) {
    const title = lang === "ar" ? "مهام مستحقة اليوم" : "Tasks Due Today"
    const body =
      dueTasks.length === 1
        ? lang === "ar"
          ? `${dueTasks[0].title} مستحقة اليوم`
          : `"${dueTasks[0].title}" is due today`
        : lang === "ar"
          ? `لديك ${dueTasks.length} مهام مستحقة اليوم`
          : `You have ${dueTasks.length} tasks due today`

    showNotification(title, { body, tag: "due-tasks-daily" })
  }

  // Find overdue tasks
  const overdueTasks = todos.filter(
    (t) => !t.completed && !t.deletedAt && t.dueDate && t.dueDate < todayStr
  )

  if (overdueTasks.length > 0) {
    const title = lang === "ar" ? "مهام متأخرة" : "Overdue Tasks"
    const body =
      overdueTasks.length === 1
        ? lang === "ar"
          ? `${overdueTasks[0].title} متأخرة`
          : `"${overdueTasks[0].title}" is overdue`
        : lang === "ar"
          ? `لديك ${overdueTasks.length} مهام متأخرة`
          : `You have ${overdueTasks.length} overdue tasks`

    showNotification(title, { body, tag: "overdue-tasks" })
  }
}

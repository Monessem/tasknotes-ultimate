export interface AchievementDef {
  key: string
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  icon: string
  tier: "bronze" | "silver" | "gold"
  condition: (state: AchievementState) => boolean
}

export interface AchievementState {
  totalTodosCompleted: number
  totalTodosCreated: number
  totalNotesCreated: number
  totalHabitsCreated: number
  currentStreak: number
  longestStreak: number
  totalPomodoroSessions: number
  totalFocusMinutes: number
  totalFoldersCreated: number
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  {
    key: "first_task",
    title: "First Step",
    titleAr: "الخطوة الأولى",
    description: "Complete your first task",
    descriptionAr: "أكمل مهمتك الأولى",
    icon: "🎯",
    tier: "bronze",
    condition: (s) => s.totalTodosCompleted >= 1,
  },
  {
    key: "five_tasks",
    title: "Getting Started",
    titleAr: "البداية",
    description: "Complete 5 tasks",
    descriptionAr: "أكمل 5 مهام",
    icon: "✅",
    tier: "bronze",
    condition: (s) => s.totalTodosCompleted >= 5,
  },
  {
    key: "ten_tasks",
    title: "Productive",
    titleAr: "منتج",
    description: "Complete 10 tasks",
    descriptionAr: "أكمل 10 مهام",
    icon: "⚡",
    tier: "silver",
    condition: (s) => s.totalTodosCompleted >= 10,
  },
  {
    key: "fifty_tasks",
    title: "Task Master",
    titleAr: "سيد المهام",
    description: "Complete 50 tasks",
    descriptionAr: "أكمل 50 مهمة",
    icon: "👑",
    tier: "gold",
    condition: (s) => s.totalTodosCompleted >= 50,
  },
  {
    key: "first_note",
    title: "Note Taker",
    titleAr: "كاتب الملاحظات",
    description: "Create your first note",
    descriptionAr: "أنشئ ملاحظتك الأولى",
    icon: "📝",
    tier: "bronze",
    condition: (s) => s.totalNotesCreated >= 1,
  },
  {
    key: "habit_starter",
    title: "Habit Starter",
    titleAr: "بادئ العادات",
    description: "Create your first habit",
    descriptionAr: "أنشئ عادتك الأولى",
    icon: "🔄",
    tier: "bronze",
    condition: (s) => s.totalHabitsCreated >= 1,
  },
  {
    key: "week_streak",
    title: "Week Warrior",
    titleAr: "محارب الأسبوع",
    description: "Maintain a 7-day streak",
    descriptionAr: "حافظ على سلسلة 7 أيام",
    icon: "🔥",
    tier: "silver",
    condition: (s) => s.currentStreak >= 7,
  },
  {
    key: "month_streak",
    title: "Unstoppable",
    titleAr: "لا يُوقف",
    description: "Maintain a 30-day streak",
    descriptionAr: "حافظ على سلسلة 30 يوماً",
    icon: "💎",
    tier: "gold",
    condition: (s) => s.currentStreak >= 30,
  },
  {
    key: "focus_time",
    title: "Deep Focus",
    titleAr: "تركيز عميق",
    description: "Complete 5 pomodoro sessions",
    descriptionAr: "أكمل 5 جلسات بومودورو",
    icon: "🧠",
    tier: "bronze",
    condition: (s) => s.totalPomodoroSessions >= 5,
  },
  {
    key: "focus_master",
    title: "Focus Master",
    titleAr: "سيد التركيز",
    description: "Complete 25 pomodoro sessions",
    descriptionAr: "أكمل 25 جلسة بومودورو",
    icon: "🧘",
    tier: "gold",
    condition: (s) => s.totalPomodoroSessions >= 25,
  },
  {
    key: "organizer",
    title: "Organizer",
    titleAr: "منظم",
    description: "Create 3 folders",
    descriptionAr: "أنشئ 3 مجلدات",
    icon: "📁",
    tier: "bronze",
    condition: (s) => s.totalFoldersCreated >= 3,
  },
  {
    key: "note_collector",
    title: "Note Collector",
    titleAr: "جامع الملاحظات",
    description: "Create 10 notes",
    descriptionAr: "أنشئ 10 ملاحظات",
    icon: "📒",
    tier: "silver",
    condition: (s) => s.totalNotesCreated >= 10,
  },
]

export function computeAchievementState(state: {
  todos: { completed: boolean; deletedAt: string | null }[]
  notes: { deletedAt: string | null }[]
  habits: { deletedAt: string | null }[]
  folders: { id: string }[]
  habitLogs: { date: string; completed: boolean }[]
  pomodoroSessions: { date: string; type: string; duration: number }[]
}): AchievementState {
  const completedTodos = state.todos.filter((t) => t.completed && !t.deletedAt).length
  const totalCreated = state.todos.filter((t) => !t.deletedAt).length
  const currentStreak = calculateStreak(state.habitLogs)

  return {
    totalTodosCompleted: completedTodos,
    totalTodosCreated: totalCreated,
    totalNotesCreated: state.notes.filter((n) => !n.deletedAt).length,
    totalHabitsCreated: state.habits.filter((h) => !h.deletedAt).length,
    currentStreak,
    longestStreak: currentStreak,
    totalPomodoroSessions: state.pomodoroSessions.filter((s) => s.type === "work").length,
    totalFocusMinutes: state.pomodoroSessions.filter((s) => s.type === "work").reduce((acc, s) => acc + s.duration, 0),
    totalFoldersCreated: state.folders.length,
  }
}

function calculateStreak(habitLogs: { date: string; completed: boolean }[]): number {
  if (habitLogs.length === 0) return 0
  const completedDates = new Set(habitLogs.filter((l) => l.completed).map((l) => l.date))
  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    if (completedDates.has(dateStr)) {
      streak++
    } else if (i > 0) {
      break
    }
  }
  return streak
}

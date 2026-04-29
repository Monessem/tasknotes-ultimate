import { create } from "zustand";
import type { Language } from "@/lib/i18n";

// View types for navigation
export type ViewType =
  | "dashboard"
  | "todos"
  | "notes"
  | "habits"
  | "important"
  | "today"
  | "calendar"
  | "focus"
  | "flagged"
  | "history"
  | "folders"
  | "recycle"
  | "settings"
  | "achievements";

// Todo type matching Prisma model
export interface Todo {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
  flagged: boolean;
  important: boolean;
  recurring: string | null;
  dueDate: string | null;
  folderId: string | null;
  tags: string[]; // Parsed from JSON
  subtasks: { id: string; title: string; completed: boolean }[];
  completedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  flagged: boolean;
  folderId: string | null;
  checklist: { id: string; text: string; completed: boolean }[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: "daily" | "weekly" | "weekdays";
  reminderTime: string | null;
  goal: number;
  notes: string;
  deletedAt: string | null;
  createdAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface PomodoroSession {
  id: string;
  date: string;
  duration: number;
  type: "work" | "shortBreak" | "longBreak";
}

export interface HistoryEntry {
  id: string;
  action: "create" | "update" | "delete" | "complete" | "flag" | "restore";
  itemType: "task" | "note" | "habit" | "folder";
  itemId: string;
  itemTitle: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  tier: string;
  unlockedAt: string | null;
  createdAt: string;
}

export interface AppSettings {
  weatherEnabled: boolean;
  weatherCity: string;
  pomodoroWork: number;
  pomodoroShortBreak: number;
  pomodoroLongBreak: number;
  taskReminders: boolean;
  soundEnabled: boolean;
  darkMode: boolean;
  language: Language;
  autoSync: boolean;
  colorTheme: string; // "emerald" | "ocean" | "sunset" etc.
}

// Modal types
export type ModalType =
  | "addTodo"
  | "editTodo"
  | "addNote"
  | "editNote"
  | "addHabit"
  | "editHabit"
  | "addFolder"
  | "editFolder"
  | "confirm"
  | null;

interface AppState {
  // Navigation
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Data
  todos: Todo[];
  setTodos: (todos: Todo[]) => void;
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  habits: Habit[];
  setHabits: (habits: Habit[]) => void;
  habitLogs: HabitLog[];
  setHabitLogs: (logs: HabitLog[]) => void;
  folders: Folder[];
  setFolders: (folders: Folder[]) => void;
  pomodoroSessions: PomodoroSession[];
  setPomodoroSessions: (sessions: PomodoroSession[]) => void;
  historyEntries: HistoryEntry[];
  setHistoryEntries: (entries: HistoryEntry[]) => void;
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;

  // Achievements
  achievements: Achievement[];
  setAchievements: (achievements: Achievement[]) => void;
  fetchAchievements: () => Promise<void>;
  checkAndUnlockAchievements: () => Promise<void>;

  // Loading
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Modal
  activeModal: ModalType;
  setActiveModal: (modal: ModalType) => void;
  editingItem: Todo | Note | Habit | Folder | null;
  setEditingItem: (item: Todo | Note | Habit | Folder | null) => void;

  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;

  // Quick Add
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;

  // Data fetching helpers
  fetchTodos: () => Promise<void>;
  fetchNotes: () => Promise<void>;
  fetchHabits: () => Promise<void>;
  fetchHabitLogs: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  fetchPomodoroSessions: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchAllData: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Navigation
  currentView: "dashboard",
  setCurrentView: (view) => set({ currentView: view }),

  // Search
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Data
  todos: [],
  setTodos: (todos) => set({ todos }),
  notes: [],
  setNotes: (notes) => set({ notes }),
  habits: [],
  setHabits: (habits) => set({ habits }),
  habitLogs: [],
  setHabitLogs: (logs) => set({ habitLogs: logs }),
  folders: [],
  setFolders: (folders) => set({ folders }),
  pomodoroSessions: [],
  setPomodoroSessions: (sessions) => set({ pomodoroSessions: sessions }),
  historyEntries: [],
  setHistoryEntries: (entries) => set({ historyEntries: entries }),
  settings: {
    weatherEnabled: true,
    weatherCity: "cairo",
    pomodoroWork: 25,
    pomodoroShortBreak: 5,
    pomodoroLongBreak: 15,
    taskReminders: true,
    soundEnabled: true,
    darkMode: false,
    language: "en",
    autoSync: false,
    colorTheme: "emerald",
  },
  setSettings: (settings) => set({ settings }),

  // Achievements
  achievements: [],
  setAchievements: (achievements) => set({ achievements }),

  fetchAchievements: async () => {
    try {
      const res = await fetch("/api/achievements");
      if (res.ok) {
        const data = await res.json();
        set({ achievements: data });
      }
    } catch (e) {
      console.error("Failed to fetch achievements:", e);
    }
  },

  checkAndUnlockAchievements: async () => {
    const state = get();
    const { computeAchievementState, ACHIEVEMENT_DEFS } = await import("@/lib/achievements");
    const achievementState = computeAchievementState({
      todos: state.todos,
      notes: state.notes,
      habits: state.habits,
      folders: state.folders,
      habitLogs: state.habitLogs,
      pomodoroSessions: state.pomodoroSessions,
    });

    const unlockedKeys = new Set(
      state.achievements.filter((a) => a.unlockedAt).map((a) => a.key)
    );

    let hasNewUnlocks = false;

    for (const def of ACHIEVEMENT_DEFS) {
      if (!unlockedKeys.has(def.key) && def.condition(achievementState)) {
        const existing = state.achievements.find((a) => a.key === def.key);
        if (existing) {
          await fetch(`/api/achievements/${existing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ unlockedAt: new Date().toISOString() }),
          });
          hasNewUnlocks = true;
        }
      }
    }

    if (hasNewUnlocks) {
      await state.fetchAchievements();
    }
  },

  // Loading
  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Modal
  activeModal: null,
  setActiveModal: (modal) => set({ activeModal: modal }),
  editingItem: null,
  setEditingItem: (item) => set({ editingItem: item }),

  // Sidebar
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  sidebarCollapsed: false,
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  // Quick Add
  quickAddOpen: false,
  setQuickAddOpen: (open) => set({ quickAddOpen: open }),

  // Data fetching helpers
  fetchTodos: async () => {
    try {
      const res = await fetch("/api/todos");
      if (res.ok) {
        const data = await res.json();
        set({ todos: data.map(parseTodo) });
      }
    } catch (e) {
      console.error("Failed to fetch todos:", e);
    }
  },

  fetchNotes: async () => {
    try {
      const res = await fetch("/api/notes");
      if (res.ok) {
        const data = await res.json();
        set({ notes: data.map(parseNote) });
      }
    } catch (e) {
      console.error("Failed to fetch notes:", e);
    }
  },

  fetchHabits: async () => {
    try {
      const res = await fetch("/api/habits");
      if (res.ok) {
        const data = await res.json();
        set({ habits: data });
      }
    } catch (e) {
      console.error("Failed to fetch habits:", e);
    }
  },

  fetchHabitLogs: async () => {
    try {
      const res = await fetch("/api/habit-logs");
      if (res.ok) {
        const data = await res.json();
        set({ habitLogs: data });
      }
    } catch (e) {
      console.error("Failed to fetch habit logs:", e);
    }
  },

  fetchFolders: async () => {
    try {
      const res = await fetch("/api/folders");
      if (res.ok) {
        const data = await res.json();
        set({ folders: data });
      }
    } catch (e) {
      console.error("Failed to fetch folders:", e);
    }
  },

  fetchPomodoroSessions: async () => {
    try {
      const res = await fetch("/api/pomodoro");
      if (res.ok) {
        const data = await res.json();
        set({ pomodoroSessions: data });
      }
    } catch (e) {
      console.error("Failed to fetch pomodoro sessions:", e);
    }
  },

  fetchHistory: async () => {
    try {
      const res = await fetch("/api/history");
      if (res.ok) {
        const data = await res.json();
        set({ historyEntries: data });
      }
    } catch (e) {
      console.error("Failed to fetch history:", e);
    }
  },

  fetchSettings: async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        set({
          settings: {
            weatherEnabled: data.weatherEnabled ?? true,
            weatherCity: data.weatherCity ?? "cairo",
            pomodoroWork: data.pomodoroWork ?? 25,
            pomodoroShortBreak: data.pomodoroShortBreak ?? 5,
            pomodoroLongBreak: data.pomodoroLongBreak ?? 15,
            taskReminders: data.taskReminders ?? true,
            soundEnabled: data.soundEnabled ?? true,
            darkMode: data.darkMode ?? false,
            language: (data.language as Language) ?? "en",
            autoSync: data.autoSync ?? false,
            colorTheme: data.colorTheme ?? "emerald",
          },
        });
      }
    } catch (e) {
      console.error("Failed to fetch settings:", e);
    }
  },

  fetchAllData: async () => {
    set({ isLoading: true });
    const state = get();
    await Promise.all([
      state.fetchTodos(),
      state.fetchNotes(),
      state.fetchHabits(),
      state.fetchHabitLogs(),
      state.fetchFolders(),
      state.fetchPomodoroSessions(),
      state.fetchHistory(),
      state.fetchSettings(),
      state.fetchAchievements(),
    ]);
    set({ isLoading: false });
  },
}));

// Parse helpers to convert JSON strings from Prisma
function parseTodo(raw: Record<string, unknown>): Todo {
  return {
    ...raw,
    tags: safeJsonParse(raw.tags as string, []),
    subtasks: safeJsonParse(raw.subtasks as string, []),
    priority: (raw.priority as Todo["priority"]) || "medium",
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    completedAt: raw.completedAt ? String(raw.completedAt) : null,
    deletedAt: raw.deletedAt ? String(raw.deletedAt) : null,
    dueDate: raw.dueDate ? String(raw.dueDate) : null,
    recurring: raw.recurring ? String(raw.recurring) : null,
    folderId: raw.folderId ? String(raw.folderId) : null,
  } as Todo;
}

function parseNote(raw: Record<string, unknown>): Note {
  return {
    ...raw,
    checklist: safeJsonParse(raw.checklist as string, []),
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    deletedAt: raw.deletedAt ? String(raw.deletedAt) : null,
    folderId: raw.folderId ? String(raw.folderId) : null,
  } as Note;
}

function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export { parseTodo, parseNote, safeJsonParse };

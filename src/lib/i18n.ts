// Internationalization system
export type Language = "en" | "ar";

const translations: Record<Language, Record<string, string>> = {
  en: {
    // App
    appName: "TaskNotes",
    appSubtitle: "Tasks & Habits Manager",

    // Navigation
    navMain: "Main",
    dashboard: "Dashboard",
    todos: "Tasks",
    notes: "Notes",
    habits: "Habits",
    navFilters: "Filters",
    important: "Important",
    today: "Today",
    flagged: "Flagged",
    history: "History",
    navOther: "Other",
    folders: "Folders",
    recycle: "Recycle Bin",
    settings: "Settings",

    // Stats
    totalTasks: "Total Tasks",
    inProgress: "In Progress",
    todayHabits: "Today's Habits",
    completionRate: "Completion Rate",
    completed: "Completed",
    consecutiveDays: "Consecutive Days",
    pomodoro: "Pomodoro",
    remaining: "Remaining",
    done: "Done",
    achievement: "Achievement",

    // Pomodoro
    pomodoroTimer: "Pomodoro Timer",
    workTime: "Work Time",
    shortBreak: "Short Break",
    longBreak: "Long Break",
    work: "Work",
    todaySessions: "Today's Sessions",
    focusMinutes: "Focus Minutes",

    // Quick Add
    quickAddTask: "New Task",
    quickAddNote: "New Note",
    quickAddHabit: "New Habit",
    quickAddFolder: "New Folder",

    // Actions
    add: "Add",
    search: "Search...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    flag: "Flag",
    unflag: "Unflag",
    duplicate: "Duplicate",
    restore: "Restore",

    // Tasks
    newTask: "New Task",
    editTask: "Edit Task",
    taskTitle: "Task Title",
    taskTitlePlaceholder: "Enter task title...",
    description: "Description",
    descriptionPlaceholder: "Add an optional description...",
    priority: "Priority",
    high: "High",
    medium: "Medium",
    low: "Low",
    dueDate: "Due Date",
    folder: "Folder",
    selectFolder: "Select folder...",
    noFolder: "No Folder",
    tags: "Tags",
    tagsPlaceholder: "Add tag and press Enter...",
    subtasks: "Subtasks",
    subtaskPlaceholder: "Add subtask...",
    recurring: "Recurring",
    noRecurring: "Not recurring",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    noTasks: "No tasks",
    noTasksDesc: "Add your first task to get started",

    // Notes
    newNote: "New Note",
    editNote: "Edit Note",
    noteTitle: "Note Title",
    noteContentPlaceholder: "Write your note here...",
    checklist: "Checklist",
    addChecklistItem: "Add item...",
    noNotes: "No notes",
    noNotesDesc: "Create your first note",
    pinned: "Pinned",

    // Habits
    dailyHabits: "Daily Habits",
    noHabits: "No habits",
    noHabitsDesc: "Add a new habit to track your daily progress",
    newHabit: "New Habit",
    editHabit: "Edit Habit",
    habitName: "Habit Name",
    habitNamePlaceholder: "Example: Read for 30 minutes",
    habitIcon: "Icon",
    habitColor: "Color",
    daysStreak: "days",
    startToday: "Start today!",

    // Folders
    newFolder: "New Folder",
    editFolder: "Edit Folder",
    folderName: "Folder Name",
    folderNamePlaceholder: "Enter folder name...",
    folderColor: "Color",
    noFolders: "No folders",
    noFoldersDesc: "Create a folder to organize your tasks",

    // Recycle Bin
    recycleBin: "Recycle Bin",
    emptyBin: "Empty Bin",
    restoreAll: "Restore All",
    noDeletedItems: "No deleted items",
    deletedItemsAppear: "Deleted items will appear here",
    permanentDelete: "Delete Permanently",

    // Settings
    weatherSettings: "Weather Settings",
    showWeather: "Show Weather",
    pomodoroSettings: "Pomodoro Settings",
    workDuration: "Work Duration",
    shortBreakDuration: "Short Break",
    longBreakDuration: "Long Break",
    minutes: "minutes",
    appearance: "Appearance",
    darkMode: "Dark Mode",
    notifications: "Notifications",
    backup: "Backup",
    exportData: "Export Data",
    importData: "Import Data",
    language: "Language",
    taskReminders: "Task Reminders",
    soundEnabled: "Sound",
    colorTheme: "Color Theme",
    emerald: "Emerald",

    // Messages
    saved: "Saved",
    deleted: "Deleted",
    restored: "Restored",
    settingsSaved: "Settings saved",
    confirmDelete: "Are you sure you want to delete?",
    cannotUndo: "This action cannot be undone",

    // Charts
    weeklyActivity: "Weekly Activity",
    todayHabitsChart: "Today's Habits",

    // Achievements
    achievements: "Achievements",
    achievementsView: "Achievements",
    unlocked: "Unlocked",
    locked: "Locked",
    bronze: "Bronze",
    silver: "Silver",
    gold: "Gold",

    // Command Palette
    commandPalette: "Command Palette",
    searchCommand: "Search for a command or page...",
    quickActions: "Quick Actions",
    noResults: "No results found",
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",

    // Toast Notifications
    taskCreated: "Task created",
    taskUpdated: "Task updated",
    taskDeleted: "Task deleted",
    taskCompleted: "Task completed!",
    noteCreated: "Note created",
    noteUpdated: "Note updated",
    noteDeleted: "Note deleted",
    habitCreated: "Habit created",
    habitUpdated: "Habit updated",
    habitDeleted: "Habit deleted",
    habitCompleted: "Habit completed!",
    folderCreated: "Folder created",
    folderUpdated: "Folder updated",
    folderDeleted: "Folder deleted",
    itemRestored: "Item restored",
    itemPermanentlyDeleted: "Item permanently deleted",
    keepItUp: "Keep it up!",
    dataExported: "Data exported successfully",
    dataImported: "Data imported successfully",
    importFailed: "Import failed",
    historyCleared: "History cleared",
    binEmptied: "Recycle bin emptied",

    // Dashboard extras
    focusTime: "Focus Time",
    recentTasks: "Recent Tasks",
    todayProgress: "Today's Progress",
    quickAddPlaceholder: "Quick add task... press Enter",
  },

  ar: {
    // App
    appName: "TaskNotes",
    appSubtitle: "إدارة المهام والعادات",

    // Navigation
    navMain: "الرئيسية",
    dashboard: "لوحة التحكم",
    todos: "المهام",
    notes: "الملاحظات",
    habits: "العادات",
    navFilters: "الفلاتر",
    important: "المهمة",
    today: "اليوم",
    flagged: "مميزة بعلم",
    history: "السجل",
    navOther: "أخرى",
    folders: "المجلدات",
    recycle: "سلة المهملات",
    settings: "الإعدادات",

    // Stats
    totalTasks: "إجمالي المهام",
    inProgress: "قيد الإنجاز",
    todayHabits: "عادات اليوم",
    completionRate: "نسبة الإنجاز",
    completed: "مكتملة",
    consecutiveDays: "أيام متتالية",
    pomodoro: "بومودورو",
    remaining: "متبقي",
    done: "مكتمل",
    achievement: "الإنجاز",

    // Pomodoro
    pomodoroTimer: "مؤقت بومودورو",
    workTime: "وقت العمل",
    shortBreak: "استراحة قصيرة",
    longBreak: "استراحة طويلة",
    work: "عمل",
    todaySessions: "جلسات اليوم",
    focusMinutes: "دقائق تركيز",

    // Quick Add
    quickAddTask: "مهمة جديدة",
    quickAddNote: "ملاحظة جديدة",
    quickAddHabit: "عادة جديدة",
    quickAddFolder: "مجلد جديد",

    // Actions
    add: "إضافة",
    search: "بحث...",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    close: "إغلاق",
    flag: "وضع علم",
    unflag: "إزالة العلم",
    duplicate: "نسخ",
    restore: "استعادة",

    // Tasks
    newTask: "مهمة جديدة",
    editTask: "تعديل المهمة",
    taskTitle: "عنوان المهمة",
    taskTitlePlaceholder: "أدخل عنوان المهمة...",
    description: "الوصف",
    descriptionPlaceholder: "أضف وصفاً اختيارياً...",
    priority: "الأولوية",
    high: "عالية",
    medium: "متوسطة",
    low: "منخفضة",
    dueDate: "تاريخ الاستحقاق",
    folder: "المجلد",
    selectFolder: "اختر مجلد...",
    noFolder: "بدون مجلد",
    tags: "الوسوم",
    tagsPlaceholder: "أضف وسم واضغط Enter...",
    subtasks: "المهام الفرعية",
    subtaskPlaceholder: "أضف مهمة فرعية...",
    recurring: "متكرر",
    noRecurring: "غير متكرر",
    daily: "يومي",
    weekly: "أسبوعي",
    monthly: "شهري",
    noTasks: "لا توجد مهام",
    noTasksDesc: "أضف مهمتك الأولى للبدء",

    // Notes
    newNote: "ملاحظة جديدة",
    editNote: "تعديل الملاحظة",
    noteTitle: "عنوان الملاحظة",
    noteContentPlaceholder: "اكتب ملاحظتك هنا...",
    checklist: "قائمة تحقق",
    addChecklistItem: "إضافة عنصر...",
    noNotes: "لا توجد ملاحظات",
    noNotesDesc: "أنشئ ملاحظتك الأولى",
    pinned: "مثبتة",

    // Habits
    dailyHabits: "العادات اليومية",
    noHabits: "لا توجد عادات",
    noHabitsDesc: "أضف عادة جديدة لتتبع تقدمك اليومي",
    newHabit: "عادة جديدة",
    editHabit: "تعديل العادة",
    habitName: "اسم العادة",
    habitNamePlaceholder: "مثال: قراءة 30 دقيقة",
    habitIcon: "الأيقونة",
    habitColor: "اللون",
    daysStreak: "يوم",
    startToday: "ابدأ اليوم!",

    // Folders
    newFolder: "مجلد جديد",
    editFolder: "تعديل المجلد",
    folderName: "اسم المجلد",
    folderNamePlaceholder: "أدخل اسم المجلد...",
    folderColor: "اللون",
    noFolders: "لا توجد مجلدات",
    noFoldersDesc: "أنشئ مجلداً لتنظيم مهامك",

    // Recycle Bin
    recycleBin: "سلة المهملات",
    emptyBin: "إفراغ السلة",
    restoreAll: "استعادة الكل",
    noDeletedItems: "لا توجد عناصر محذوفة",
    deletedItemsAppear: "العناصر المحذوفة ستظهر هنا",
    permanentDelete: "حذف نهائي",

    // Settings
    weatherSettings: "إعدادات الطقس",
    showWeather: "عرض الطقس",
    pomodoroSettings: "إعدادات بومودورو",
    workDuration: "وقت العمل",
    shortBreakDuration: "استراحة قصيرة",
    longBreakDuration: "استراحة طويلة",
    minutes: "دقيقة",
    appearance: "المظهر",
    darkMode: "الوضع الداكن",
    notifications: "التنبيهات",
    backup: "النسخ الاحتياطي",
    exportData: "تصدير البيانات",
    importData: "استيراد البيانات",
    language: "اللغة",
    taskReminders: "تذكير المهام",
    soundEnabled: "الصوت",
    colorTheme: "نظام الألوان",
    emerald: "زمردي",

    // Messages
    saved: "تم الحفظ",
    deleted: "تم الحذف",
    restored: "تم الاستعادة",
    settingsSaved: "تم حفظ الإعدادات",
    confirmDelete: "هل أنت متأكد من الحذف؟",
    cannotUndo: "لا يمكن التراجع عن هذا الإجراء",

    // Charts
    weeklyActivity: "النشاط الأسبوعي",
    todayHabitsChart: "عادات اليوم",

    // Achievements
    achievements: "الإنجازات",
    achievementsView: "الإنجازات",
    unlocked: "مفتوحة",
    locked: "مقفلة",
    bronze: "برونزي",
    silver: "فضي",
    gold: "ذهبي",

    // Command Palette
    commandPalette: "لوحة الأوامر",
    searchCommand: "ابحث عن أمر أو صفحة...",
    quickActions: "إجراءات سريعة",
    noResults: "لا توجد نتائج",
    goodMorning: "صباح الخير",
    goodAfternoon: "مساء الخير",
    goodEvening: "مساء الخير",

    // Toast Notifications
    taskCreated: "تم إنشاء المهمة",
    taskUpdated: "تم تحديث المهمة",
    taskDeleted: "تم حذف المهمة",
    taskCompleted: "تم إنجاز المهمة!",
    noteCreated: "تم إنشاء الملاحظة",
    noteUpdated: "تم تحديث الملاحظة",
    noteDeleted: "تم حذف الملاحظة",
    habitCreated: "تم إنشاء العادة",
    habitUpdated: "تم تحديث العادة",
    habitDeleted: "تم حذف العادة",
    habitCompleted: "تم إكمال العادة!",
    folderCreated: "تم إنشاء المجلد",
    folderUpdated: "تم تحديث المجلد",
    folderDeleted: "تم حذف المجلد",
    itemRestored: "تم استعادة العنصر",
    itemPermanentlyDeleted: "تم حذف العنصر نهائياً",
    keepItUp: "استمر!",
    dataExported: "تم تصدير البيانات بنجاح",
    dataImported: "تم استيراد البيانات بنجاح",
    importFailed: "فشل الاستيراد",
    historyCleared: "تم مسح السجل",
    binEmptied: "تم إفراغ سلة المهملات",

    // Dashboard extras
    focusTime: "وقت التركيز",
    recentTasks: "المهام الأخيرة",
    todayProgress: "تقدم اليوم",
    quickAddPlaceholder: "إضافة سريعة... اضغط Enter",
  },
};

export function t(key: string, lang: Language = "en"): string {
  return translations[lang]?.[key] || key;
}

export function getTranslations(lang: Language): Record<string, string> {
  return translations[lang] || translations.en;
}

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Todo" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "important" BOOLEAN NOT NULL DEFAULT false,
    "recurring" TEXT,
    "dueDate" TEXT,
    "folderId" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "subtasks" TEXT NOT NULL DEFAULT '[]',
    "completedAt" TEXT,
    "deletedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Todo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "color" TEXT NOT NULL DEFAULT '#10b981',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "folderId" TEXT,
    "checklist" TEXT NOT NULL DEFAULT '[]',
    "deletedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🎯',
    "color" TEXT NOT NULL DEFAULT '#10b981',
    "frequency" TEXT NOT NULL DEFAULT 'daily',
    "reminderTime" TEXT,
    "goal" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT NOT NULL DEFAULT '',
    "deletedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Habit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HabitLog" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HabitLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#10b981',
    "icon" TEXT NOT NULL DEFAULT '📁',

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PomodoroSession" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 25,
    "type" TEXT NOT NULL DEFAULT 'work',

    CONSTRAINT "PomodoroSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistoryEntry" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "itemTitle" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'app-settings',
    "weatherEnabled" BOOLEAN NOT NULL DEFAULT true,
    "weatherCity" TEXT NOT NULL DEFAULT 'cairo',
    "pomodoroWork" INTEGER NOT NULL DEFAULT 25,
    "pomodoroShortBreak" INTEGER NOT NULL DEFAULT 5,
    "pomodoroLongBreak" INTEGER NOT NULL DEFAULT 15,
    "taskReminders" BOOLEAN NOT NULL DEFAULT true,
    "soundEnabled" BOOLEAN NOT NULL DEFAULT true,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "language" TEXT NOT NULL DEFAULT 'en',
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "colorTheme" TEXT NOT NULL DEFAULT 'emerald',
    "gitHubToken" TEXT NOT NULL DEFAULT '',
    "gistId" TEXT NOT NULL DEFAULT '',
    "fontSize" TEXT NOT NULL DEFAULT 'medium',
    "autoStartPomodoro" BOOLEAN NOT NULL DEFAULT false,
    "longBreakInterval" INTEGER NOT NULL DEFAULT 4,
    "reminderTime" TEXT NOT NULL DEFAULT 'morning',
    "displayName" TEXT NOT NULL DEFAULT '',
    "privacyMode" BOOLEAN NOT NULL DEFAULT false,
    "pomodoroEnabled" BOOLEAN NOT NULL DEFAULT true,
    "achievementsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "weeklyReportEnabled" BOOLEAN NOT NULL DEFAULT true,
    "weatherApiKey" TEXT NOT NULL DEFAULT '',
    "webhookUrl" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🏆',
    "tier" TEXT NOT NULL DEFAULT 'bronze',
    "unlockedAt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_key_key" ON "Achievement"("key");

-- AddForeignKey
ALTER TABLE "Todo" ADD CONSTRAINT "Todo_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HabitLog" ADD CONSTRAINT "HabitLog_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

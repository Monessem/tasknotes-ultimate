# Round-11: Data Insights + Enhanced History View

## Task
Add Weekly Insights section to Dashboard and polish History View

## Changes Made

### 1. i18n Keys (src/lib/i18n.ts)
Added 12 new keys in both en and ar sections:
- weeklyInsights, tasksCompletedWeek, habitsCompletedWeek, focusSessionsWeek
- vsLastWeek, moreTasks, fewerTasks, sameTasks
- bestStreak, filterAction, mostActiveDay, allActions

### 2. Dashboard Weekly Insights (src/components/app-shell.tsx)
- Added weekly calculations (thisWeek/lastWeek date ranges, task/habit/focus counts)
- Added streak calculations (habit streak, pomodoro streak)
- Added week-over-week comparison logic
- Added Weekly Insights UI card between Today's Focus and Stats row
- Imported new icons: CheckCircle2, Timer, ArrowUpRight, ArrowDownRight, Minus

### 3. History View Enhancement (src/components/views/history-view.tsx)
- Complete rewrite with ActionFilter state and search integration
- Added shadcn Select for action type filtering
- Added Input for search filtering (using store searchQuery)
- Added summary stats row (total entries, most active day, most common action)
- Enhanced timeline: gradient line, larger dots, hover lift effects
- Added active filter badges with remove functionality
- Added empty state for filtered results

## Lint
✅ Passes with zero errors

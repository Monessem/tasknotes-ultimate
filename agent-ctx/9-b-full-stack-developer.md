# Task 9-b: Settings, Recycle, History, Folder Detail Views

## Summary
Created all 11 view components for the TaskNotes Ultimate application and updated app-shell.tsx to use real components instead of placeholders.

## Files Created
1. `/src/components/views/settings-view.tsx` - Full settings page with 6 sections (weather, pomodoro, appearance, notifications, backup, about)
2. `/src/components/views/recycle-view.tsx` - Recycle bin with restore/permanent delete/empty bin
3. `/src/components/views/history-view.tsx` - Activity history timeline grouped by date
4. `/src/components/views/folder-detail-view.tsx` - Folder contents with back button
5. `/src/components/views/todos-view.tsx` - Full todos list with toggle, priority sort, search
6. `/src/components/views/notes-view.tsx` - Notes grid with pinned section
7. `/src/components/views/habits-view.tsx` - Habits with toggle, streak, 7-day calendar
8. `/src/components/views/folders-view.tsx` - Folders grid with onSelectFolder callback
9. `/src/components/views/important-view.tsx` - Important tasks and flagged notes
10. `/src/components/views/today-view.tsx` - Today's due tasks and habits
11. `/src/components/views/flagged-view.tsx` - Flagged tasks and notes

## Files Modified
1. `/src/components/app-shell.tsx` - Replaced all placeholders, added folder detail navigation
2. `/src/lib/i18n.ts` - Added taskReminders and soundEnabled keys

## Key Decisions
- Used `effectiveFolderId` derived value instead of useEffect to clear selectedFolderId (avoiding lint error)
- Export data fetches all data via parallel API calls and creates JSON blob download
- Import data reads JSON file and posts entities to each API endpoint
- Settings auto-save on change with visual save indicator
- Recycle bin uses PUT to set deletedAt:null for restore
- History groups entries by date with relative timestamps

## Lint Status
- All files pass ESLint with no errors

# Task ID: 2 - Settings Refactor

## Agent: settings-refactor

## Task: Refactor Settings view by extracting sections into separate components

## Work Log:
- Read worklog.md and the complete settings-view.tsx (1507 lines)
- Analyzed the file structure: 12 sections + confirm dialog, shared constants, utility functions
- Created `/home/z/my-project/src/components/settings/` directory with 9 new files:
  1. `settings-shared.tsx` - Shared types (Lang, UpdateSettingsFn), sectionClass, constants (CITIES, COLOR_THEMES, SHORTCUTS, TECH_BADGES), utility functions (getInitials, formatDate)
  2. `profile-section.tsx` - Profile section with avatar, name, stats (uses own useMemo for profileStats)
  3. `appearance-section.tsx` - Dark mode, color theme picker, language, font size (uses useTheme)
  4. `pomodoro-section.tsx` - Pomodoro timer settings (work/short/long break, auto-start, long break interval)
  5. `notifications-section.tsx` - Task reminders, reminder time, sound, browser notifications (owns notifPermission state)
  6. `weather-section.tsx` - Weather toggle and city selector
  7. `data-section.tsx` - Data statistics, export/import, danger zone (owns importing state, fileInputRef, export/import handlers)
  8. `security-section.tsx` - Security & Privacy, API Integrations, Feature Toggles, Audit & Logs (4 cards in one component)
  9. `about-section.tsx` - Keyboard shortcuts reference and about app info
- Rewrote `settings-view.tsx` to compose all section components
  - Kept: save indicator, confirm dialog, updateSettings, handleResetDefaults, handleClearAllData
  - Delegated: all section rendering to individual components
  - Reduced from 1507 lines to ~160 lines
- ESLint: zero errors
- Dev server: running and responding correctly

## Design Decisions:
- Security section contains 4 cards (Security & Privacy, API Integrations, Feature Toggles, Audit & Logs) as they share the same settings props
- About section contains 2 cards (Keyboard Shortcuts, About App) as they are read-only
- Each section component accepts `settings`, `updateSettings`, and `lang` as props with specific sub-types
- Data section uses callbacks (`onResetDefaults`, `onClearAllData`) instead of managing its own confirm dialog
- The confirm dialog remains in the main SettingsView as it coordinates between data section and the reset/clear actions
- All visual behavior preserved exactly - this is purely a code organization refactor

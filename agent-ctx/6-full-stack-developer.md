---
Task ID: 6
Agent: full-stack-developer
Task: Build main layout and sidebar

Work Log:
- Read project context files: worklog.md, app-store.ts, i18n.ts, globals.css, layout.tsx, index.html reference
- Created `/src/components/theme-provider.tsx` - Simple theme provider wrapper using next-themes with attribute="class", defaultTheme="system", enableSystem=true
- Created `/src/app/api/weather/route.ts` - Weather API route using Open-Meteo API with city coordinates lookup, fallback data, and 30-minute cache
- Created `/src/components/sidebar.tsx` - Full sidebar component with:
  - Logo section (ClipboardList icon + "TaskNotes" gradient text + subtitle)
  - Weather widget (fetches from /api/weather, shows temp/description/city with appropriate weather icons)
  - Navigation sections: Main (Dashboard, Tasks, Notes, Habits), Filters (Important, Today, Flagged, History), Other (Folders, Recycle Bin, Settings)
  - Active nav item has emerald-to-teal gradient background with white text
  - Count badges for items (active todos, important, today, flagged)
  - Quick stats footer (completed, streak, pomodoro sessions)
  - Responsive: uses Sheet component for mobile, fixed sidebar for desktop (hidden on lg, visible at lg:w-[300px])
  - All Lucide icons (no emojis)
- Created `/src/components/app-header.tsx` - Header component with:
  - Mobile menu button (triggers sidebar sheet)
  - View title + icon (dynamic based on currentView)
  - Search input (hidden on mobile)
  - Add button (gradient emerald-to-teal, responsive icon-only on mobile)
  - Theme toggle (sun/moon icon with rotation animation)
- Created `/src/components/app-shell.tsx` - Main layout wrapper with:
  - Sidebar on left + main content area
  - Sticky header
  - Dashboard view with stats cards, pomodoro timer, recent tasks list
  - Placeholder views for other sections
  - Loading spinner during data fetch
  - Uses fetchAllData() from Zustand store on mount
- Created `/src/components/pomodoro-timer.tsx` - Pomodoro timer with:
  - SVG circular progress ring with gradient stroke
  - Time display (MM:SS format with tabular-nums)
  - Play/pause/reset buttons
  - Mode selector (work, short break, long break) with gradient active states
  - Stats section (today sessions, focus minutes, streak)
  - Background timer support via endTime calculation and visibilitychange event
  - Proper cleanup of setInterval
- Updated `/src/app/layout.tsx` - Added ThemeProvider wrapper, updated metadata to TaskNotes branding
- Updated `/src/app/page.tsx` - Renders AppShell component
- Updated `/src/app/globals.css` - Custom emerald/teal color scheme for both light and dark modes, custom scrollbar styling
- Fixed ESLint error: removed setState-in-effect pattern for endTime, moved to handlePlayPause callback instead
- Verified: lint passes, dev server runs, page renders correctly

Stage Summary:
- Complete sidebar + header + shell layout system is working
- Responsive design: sidebar is sheet on mobile, fixed on desktop
- Dark mode support via next-themes with emerald/teal color scheme
- Weather API working with Open-Meteo integration
- Pomodoro timer fully functional with circular SVG display
- Dashboard view shows stats cards and recent tasks
- All navigation works through Zustand store (currentView switching)

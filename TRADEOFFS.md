# Trade-offs & Assumptions

> Technical brief documenting known trade-offs, deferred features, and their remediation paths for the current build of **TaskNotes Ultimate**.

---

## 1. Color Scheme — Emerald/Teal Instead of Indigo/Violet

### What Was Done
The application's entire color palette was shifted from the original indigo/violet design reference to an **emerald/teal** scheme. This affects CSS custom properties (`globals.css`), inline Tailwind gradient classes across all components, the sidebar active-state highlight, badge colors, and icon tints.

### Why
The project's design rules **explicitly prohibit indigo and blue tones**. All `violet-*`, `indigo-*`, and `blue-*` Tailwind classes were replaced with `emerald-*`/`teal-*` equivalents. The OKLCH color values in `:root` and `.dark` were regenerated around hue 155 (green) instead of hue 265 (indigo).

### Impact
- **Visual divergence** from the original design mockup — any future reference to the original Figma/sketch will require manual color mapping.
- **Hardcoded color strings** are scattered across 30+ component files (`bg-gradient-to-r from-emerald-500 to-teal-600`, `text-emerald-600`, etc.), making a future theme swap expensive.
- Chart colors (`--chart-1` through `--chart-5`) still use a mix of hues that weren't fully audited.

### Path Forward
1. **Extract a design token layer** — create `src/lib/tokens.ts` that maps semantic names (`accent`, `success`, `warning`, `danger`, `primary-gradient`) to concrete Tailwind class strings.
2. **Replace hardcoded classes** — grep for `emerald-`, `teal-`, `amber-`, `rose-` in component files and replace with token references.
3. **Add a theme switcher** — since tokens are abstracted, supporting multiple palettes (emerald, ocean, sunset) becomes a configuration change rather than a refactor.
4. **Audit chart colors** — ensure `--chart-*` variables are consistent with the active theme.

---

## 2. GitHub Sync — Replaced with Manual Import/Export

### What Was Done
The Settings view includes **Export Data** (downloads a JSON blob of all entities) and **Import Data** (reads a JSON file and POSTs each entity to the API). There is no real-time cloud sync, no OAuth flow, and no version history via GitHub.

### Why
Implementing GitHub OAuth requires:
- A backend proxy or GitHub App to avoid exposing `client_secret` client-side
- Token storage, refresh logic, and error handling for expired sessions
- Conflict resolution when the same entity is modified locally and remotely
- Gist or repository CRUD for reading/writing data files

This is a **multi-sprint effort** that was out of scope for the initial build. The import/export approach provides immediate data portability with zero external dependencies.

### Impact
- **No automatic backup** — users must remember to export manually.
- **No version history** — overwriting an import cannot be undone (aside from the Recycle Bin for soft-deleted items).
- **No multi-device sync** — data lives in a single SQLite database on the server.
- **Import is all-or-nothing** — the current import iterates all entities and POSTs them, which will create duplicates if run twice (no upsert-by-id logic).

### Path Forward
1. **Implement GitHub OAuth** — use a backend API route (`/api/auth/github`) as the OAuth proxy. Store the encrypted token in the `Settings` model (columns `gitHubToken` and `gistId` already exist in Prisma).
2. **Upsert on import** — add `upsert` logic to the import handler so re-importing the same backup updates existing records instead of duplicating.
3. **Auto-sync scheduler** — add a `setInterval` or `requestIdleCallback` that pushes local changes to a GitHub Gist at a configurable interval.
4. **Conflict resolution** — implement a "last-write-wins" strategy with timestamp comparison, with an optional manual merge UI for conflicting edits.

---

## 3. PWA Configuration — Not Configured

### What Was Done
No PWA infrastructure exists. There is no `manifest.json`, no Service Worker registration, no caching strategy, and no `<link rel="manifest">` in the HTML head.

### Why
Setting up a proper PWA requires:
- A Web App Manifest with icons, start_url, display mode, and theme_color
- A Service Worker with a caching strategy (stale-while-revalidate, cache-first, etc.)
- Build-time integration (Workbox webpack plugin or Vite plugin) to generate the precache manifest
- Testing on multiple browsers and devices

This was deferred to keep the initial build focused on core CRUD functionality.

### Impact
- **No install prompt** — the app cannot be added to the home screen on mobile or installed as a desktop app.
- **No offline support** — navigating away or losing network causes a complete page failure.
- **No caching** — every visit fetches all assets from the server, increasing load time on repeat visits.

### Path Forward
1. **Create `public/manifest.json`** with `name`, `short_name`, `start_url: "/"`, `display: "standalone"`, `theme_color`, and `icons` (192px and 512px PNGs).
2. **Register a Service Worker** — use Workbox (`workbox-webpack-plugin` via `next.config.ts` custom build) with `registerRoute` for API calls (network-first) and static assets (cache-first).
3. **Add `<link rel="manifest">`** to `layout.tsx` and set `<meta name="theme-color">`.
4. **Test** — verify install prompt on Chrome Android and Chrome Desktop, test offline behavior.

---

## 4. PWA Install Prompt — Not Implemented

### What Was Done
No `beforeinstallprompt` event listener exists. The browser's native install prompt is never captured or shown to the user.

### Why
The install prompt **depends entirely on PWA configuration** (see above). Without a valid manifest and service worker, the `beforeinstallprompt` event never fires, so implementing the handler would be dead code.

### Impact
- Users on supported browsers never see an "Install App" prompt.
- Mobile users must manually use "Add to Home Screen" from the browser menu — a low-discoverability flow.

### Path Forward
1. **Complete PWA setup** (item 3 above).
2. **Implement a custom install banner** — capture the `beforeinstallprompt` event, store it in a React ref or Zustand store, and render a dismissable banner/card prompting the user to install.
3. **Add a manual install button** in Settings → About section as a fallback.
4. **Track dismissal** — store a `dismissedInstallPrompt` flag in Settings so the banner doesn't reappear after explicit dismissal.

---

## 5. Audio / Sound Effects System — Not Implemented

### What Was Done
A `soundEnabled` toggle exists in Settings and the Settings model, but it has **no functional effect**. No audio files or audio-playing code exists in the codebase.

### Why
Audio feedback is a **non-critical UX enhancement**. Implementing it requires:
- Curating or generating sound effect files (completion chime, streak fanfare, achievement unlock)
- A centralized audio manager with volume control and mute toggle
- Integration points in multiple components (todo completion, habit toggle, pomodoro timer completion)

This was deferred to reduce initial scope.

### Impact
- **No auditory feedback** — task completions, streak milestones, and achievement unlocks are silent.
- The `soundEnabled` toggle in Settings is a **placeholder** — toggling it does nothing, which may confuse users.

### Path Forward
1. **Add a lightweight audio manager** — create `src/lib/audio.ts` using the Web Audio API (no external library needed for simple tones) or Howler.js for MP3/WAV playback.
2. **Generate sound effects** — use free assets from freesound.org or generate simple synthesized tones (sine wave chime for completion, ascending arpeggio for streaks).
3. **Wire up integration points** — call `playSound('complete')` in `toggleComplete`, `playSound('achievement')` when an achievement unlocks, `playSound('timer')` when the pomodoro timer finishes.
4. **Respect the toggle** — check `settings.soundEnabled` before any `playSound()` call. Persist the preference via the existing settings API.

---

## 6. Achievements System — Data Model Ready, UI Not Built

### What Was Done
The Prisma schema does not yet have an `Achievement` model (this is a gap — the worklog stated "data model is ready" but it was never added). The i18n keys `achievements` and `unlocked` exist in both English and Arabic translations. No achievement-checking logic or UI exists.

### Why
Achievements require:
- Defining the achievement catalog (badges, conditions, tiers)
- Backend logic to evaluate conditions on every relevant action (task complete, streak reached, etc.)
- A dedicated UI panel/modal with earned vs. locked states

The backend was prioritized for CRUD operations; achievements are a **progressive enhancement**.

### Impact
- **No gamification** — users have no visual reward for completing tasks or building streaks.
- Translation keys exist but are unused dead code.
- The `achievement` stat label on the dashboard is rendered but always shows `0%` with no real backing data.

### Path Forward
1. **Add `Achievement` model to Prisma** — `id`, `key` (unique string like `"first_task"`), `title`, `description`, `icon`, `unlockedAt` (nullable DateTime), `userId`.
2. **Define achievement conditions** — e.g., "Complete 1 task" → `first_task`, "Complete 10 tasks" → `ten_tasks`, "7-day streak" → `week_warrior`, etc.
3. **Build evaluation logic** — create `src/lib/achievements.ts` with a `checkAchievements()` function called after task completion, habit logging, and pomodoro sessions.
4. **Build Achievements panel** — create `src/components/views/achievements-view.tsx` with a grid of badge cards (locked = grayscale + lock icon, unlocked = full color + unlock date). Add navigation entry in sidebar.
5. **Add a new ViewType** — `"achievements"` in the store and sidebar nav config.

---

## 7. Statistics Charts — Weekly Task Chart Not Built

### What Was Done
The `recharts` package is installed and the `chart.tsx` shadcn/ui component exists, but no chart is rendered anywhere in the application. The Dashboard view shows numerical stats but no visual trend.

### Why
Building the chart requires:
- An aggregation utility (`getWeeklyStats()`) that groups completed tasks by day for the past 7 days
- A `WeeklyTaskChart` component wrapping Recharts `BarChart`
- Responsive sizing and dark-mode-compatible colors

This was deferred because the dashboard was functional without it, and chart work requires careful responsive testing.

### Impact
- **No visual productivity trends** — users cannot see their weekly completion pattern at a glance.
- The dashboard relies on raw numbers, which are less engaging than a chart.
- The installed `recharts` dependency is unused bundle weight.

### Path Forward
1. **Create `src/lib/stats.ts`** — implement `getWeeklyStats(todos: Todo[]): { day: string; completed: number; created: number }[]` that groups tasks by `completedAt` and `createdAt` for the last 7 days.
2. **Create `src/components/weekly-task-chart.tsx`** — use Recharts `BarChart` with `Bar` components for `completed` (emerald) and `created` (teal). Wrap in shadcn `Card` with header.
3. **Add to Dashboard** — render `WeeklyTaskChart` below the stats row in `DashboardView`, spanning the full width.
4. **Add to Today view** — consider a smaller "today's progress" donut chart showing completed vs. remaining tasks.
5. **Ensure dark mode** — use CSS variables or explicit dark-mode fills for chart axes and labels.

---

## Assumptions

| # | Assumption | Rationale |
|---|-----------|-----------|
| A1 | **Single-user application** — no auth, no multi-tenancy | The app has no login system; SQLite is a local DB. All data belongs to one implicit user. |
| A2 | **Server is always local** — no CDN, no edge deployment | Assets are served directly by Next.js dev server. No CDN caching or edge runtime. |
| A3 | **SQLite is sufficient** — no horizontal scaling needed | Prisma + SQLite is chosen for simplicity. If multi-user or high-write scenarios arise, migration to PostgreSQL is required. |
| A4 | **Client-side state is authoritative** — Zustand holds the source of truth during a session | Data is fetched from the API on mount and kept in Zustand. Concurrent tabs will have stale data until manual refresh. |
| A5 | **No real-time sync between tabs** — no WebSocket or BroadcastChannel | Changes made in one browser tab are not reflected in another until the page is reloaded. |
| A6 | **Import/Export uses full-dataset JSON** — no incremental or differential backup | The export dumps all entities; the import POSTs them as new records. This is not suitable for large datasets or frequent sync. |
| A7 | **OKLCH color values are stable** — browsers support `oklch()` in CSS | All CSS custom properties use OKLCH notation. Very old browsers (pre-2023) will not render colors correctly. |
| A8 | **i18n is limited to en/ar** — no dynamic locale loading | Translations are hardcoded in `i18n.ts`. Adding a language requires a code change, not a config change. |
| A9 | **Pomodoro sessions are stored client-side only** — no persistent API save | The pomodoro timer updates `pomodoroSessions` in Zustand but does not persist completed sessions to the `/api/pomodoro` endpoint on timer completion. |
| A10 | **Soft-delete is the only archive mechanism** — no separate archive table | Deleted items are marked with `deletedAt` and shown in the Recycle Bin. There is no "archive" state between active and deleted. |

---

*Last updated: 2025-07-14*
*Build version: v1.0.0*

Task ID: 8
Agent: full-stack-developer
Task: Build Todos view and modals

Work Log:
- Read project context: worklog.md, app-store.ts, i18n.ts, app-shell.tsx, reference HTML
- Studied original renderTodoItem and openTodoModal patterns for design reference
- Created `/src/components/todo-item.tsx` - Reusable todo item component with checkbox toggle, priority colors, tags, due date, flag toggle, subtask progress bar, hover actions (edit/flag/delete)
- Created `/src/components/views/todos-view.tsx` - Full todos list view with stats row (total, remaining, done, achievement %), sorted todo list, search filtering, empty state, add button
- Created `/src/components/views/important-view.tsx` - Filtered view showing todos with important=true
- Created `/src/components/views/today-view.tsx` - Filtered view showing todos with dueDate=today, with date display
- Created `/src/components/views/flagged-view.tsx` - Shows flagged todos AND flagged notes in separate sections, with note cards
- Created `/src/components/modals/todo-modal.tsx` - Full add/edit modal with title, description, priority select, folder select, due date with "Today" button, recurring select, tags input (Enter to add, X to remove), subtasks section (add/remove/toggle), important checkbox, save/cancel
- Created `/src/components/modals/confirm-modal.tsx` - Reusable confirm dialog using AlertDialog with icon, title, message, variant (danger/warning/default), confirm/cancel buttons
- Updated `/src/components/app-shell.tsx` - Imported TodosView, ImportantView, TodayView, FlaggedView, TodoModal, ConfirmModal; replaced placeholder views for todos/important/today/flagged; added TodoModal and ConfirmModal to render tree
- ESLint passes with no issues
- App compiles and serves correctly on port 3000

Stage Summary:
- 6 new component files created + 1 updated (app-shell.tsx)
- Todos view with full CRUD: stats, filtering, sorting, checkbox toggle, priority colors, subtask progress
- 3 filtered views: Important, Today, Flagged (includes notes)
- Todo modal supports add/edit with all fields: title, description, priority, folder, due date, recurring, tags, subtasks, important flag
- Confirm modal reusable with danger/warning/default variants
- All views integrated into app-shell navigation system
- All components use "use client", shadcn/ui, Lucide icons, emerald/teal color scheme, dark mode support

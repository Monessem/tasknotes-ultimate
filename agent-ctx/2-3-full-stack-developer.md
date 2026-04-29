# Task 2-3: Collapsible Sidebar + DnD Task Reordering

## Summary
Implemented two features: collapsible sidebar and drag-and-drop task reordering.

## Files Modified
1. `/src/store/app-store.ts` - Added `sidebarCollapsed` boolean and `toggleSidebarCollapsed` action
2. `/src/components/sidebar.tsx` - Complete rewrite with collapsed mode support, toggle button, conditional rendering
3. `/src/components/views/todos-view.tsx` - Added dnd-kit integration with SortableTodoItem component, localStorage order persistence

## Key Implementation Details
- Sidebar collapses to 60px with smooth 300ms CSS transition
- Collapsed mode shows only icons, hides text/headers/badges/weather/stats
- Native `title` attribute for tooltips when collapsed
- Mobile sheet sidebar unaffected by collapse state
- DnD uses @dnd-kit/core DndContext + @dnd-kit/sortable SortableContext
- Sort order stored in localStorage as `todo-order` key
- Only applies to LIST view, only INCOMPLETE tasks
- PointerSensor with 8px activation distance
- GripVertical handle on hover

## Verification
- `bun run lint` passes with no errors
- Dev server compiling successfully

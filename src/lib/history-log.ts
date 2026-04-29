type HistoryAction = "create" | "update" | "delete" | "complete" | "flag" | "restore"
type HistoryItemType = "task" | "note" | "habit" | "folder"

export async function logHistory(
  action: HistoryAction,
  itemType: HistoryItemType,
  itemId: string,
  itemTitle: string
): Promise<void> {
  try {
    await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, itemType, itemId, itemTitle }),
    })
  } catch {
    // Silently fail - history is non-critical
  }
}

"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { t } from "@/lib/i18n"
import { useAppStore } from "@/store/app-store"
import { AlertTriangle, Trash2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: "danger" | "warning" | "default"
  icon?: React.ReactNode
  onConfirm: () => void
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "danger",
  icon,
  onConfirm,
}: ConfirmModalProps) {
  const { settings } = useAppStore()
  const lang = settings.language

  const defaultIcon =
    variant === "danger" ? (
      <Trash2 className="size-6 text-destructive" />
    ) : variant === "warning" ? (
      <AlertTriangle className="size-6 text-amber-500" />
    ) : (
      <XCircle className="size-6 text-muted-foreground" />
    )

  const confirmColorClass =
    variant === "danger"
      ? "bg-destructive hover:bg-destructive/90 text-white"
      : variant === "warning"
        ? "bg-amber-600 hover:bg-amber-700 text-white"
        : ""

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted/50">
              {icon || defaultIcon}
            </div>
            <div>
              <AlertDialogTitle className="text-lg font-semibold">
                {title || t("confirmDelete", lang)}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-sm text-muted-foreground">
                {message || t("cannotUndo", lang)}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>
            {cancelLabel || t("cancel", lang)}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(confirmColorClass)}
          >
            {confirmLabel || t("delete", lang)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

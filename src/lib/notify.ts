import { toast } from "sonner"
import type { Language } from "@/lib/i18n"
import { t } from "@/lib/i18n"

export function notifySuccess(lang: Language, key: string) {
  toast.success(t(key, lang))
}

export function notifyError(lang: Language, key: string) {
  toast.error(t(key, lang))
}

export function notifyAction(title: string, description?: string) {
  toast(title, { description })
}

export function notifyCreated(lang: Language, itemType: string) {
  toast.success(t(`${itemType}Created`, lang))
}

export function notifyUpdated(lang: Language, itemType: string) {
  toast.success(t(`${itemType}Updated`, lang))
}

export function notifyDeleted(lang: Language, itemType: string) {
  toast.success(t(`${itemType}Deleted`, lang))
}

export function notifyCompleted(lang: Language, itemType: string) {
  toast.success(t(`${itemType}Completed`, lang), {
    description: t("keepItUp", lang),
  })
}

export function notifyRestored(lang: Language) {
  toast.success(t("itemRestored", lang))
}

export function notifyPermanentDeleted(lang: Language) {
  toast.success(t("itemPermanentlyDeleted", lang))
}

"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAppStore } from "@/store/app-store"

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function InstallPrompt() {
  const { settings } = useAppStore()
  const lang = settings.language
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      const dismissed = localStorage.getItem("tasknotes-dismissed-install")
      if (!dismissed) {
        setShowBanner(true)
      }
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem("tasknotes-dismissed-install", "true")
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-emerald-500/20 bg-card/95 p-4 shadow-2xl backdrop-blur-xl sm:left-auto sm:right-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
          <Download className="size-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {lang === "ar" ? "تثبيت التطبيق" : "Install App"}
          </p>
          <p className="text-xs text-muted-foreground">
            {lang === "ar" ? "أضف إلى شاشتك الرئيسية" : "Add to your home screen"}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          onClick={handleInstall}
          size="sm"
          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md"
        >
          {lang === "ar" ? "تثبيت" : "Install"}
        </Button>
        <Button onClick={handleDismiss} size="sm" variant="outline" className="flex-1">
          {lang === "ar" ? "ليس الآن" : "Not now"}
        </Button>
      </div>
    </div>
  )
}

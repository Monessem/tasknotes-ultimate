"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useAppStore } from "@/store/app-store"
import { Plus, ListTodo, Repeat, StickyNote, FolderOpen, Timer } from "lucide-react"
import { audioManager } from "@/lib/audio"
import { t } from "@/lib/i18n"

const FAB_ITEMS = [
  {
    id: "addTodo",
    icon: ListTodo,
    labelKey: "quickAddTask",
    action: "addTodo" as const,
  },
  {
    id: "addHabit",
    icon: Repeat,
    labelKey: "quickAddHabit",
    action: "addHabit" as const,
  },
  {
    id: "addNote",
    icon: StickyNote,
    labelKey: "quickAddNote",
    action: "addNote" as const,
  },
  {
    id: "addFolder",
    icon: FolderOpen,
    labelKey: "quickAddFolder",
    action: "addFolder" as const,
  },
  {
    id: "focus",
    icon: Timer,
    labelKey: "startPomodoro",
    action: "focus" as const,
  },
]

export function SmartFAB() {
  const { currentView, setActiveModal, setCurrentView, settings } = useAppStore()
  const lang = settings.language
  const [isOpen, setIsOpen] = useState(false)

  const toggleFAB = useCallback(() => {
    setIsOpen((prev) => !prev)
    audioManager.play("click")
  }, [])

  const handleItemClick = useCallback(
    (item: (typeof FAB_ITEMS)[number]) => {
      setIsOpen(false)
      if (item.action === "focus") {
        setCurrentView("focus")
      } else {
        setActiveModal(item.action)
      }
      audioManager.play("click")
    },
    [setActiveModal, setCurrentView]
  )

  const closeFAB = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={closeFAB}
          />
        )}
      </AnimatePresence>

      {/* FAB Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Menu items */}
        <AnimatePresence>
          {isOpen &&
            FAB_ITEMS.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                transition={{
                  duration: 0.2,
                  ease: "easeOut",
                  delay: index * 0.05,
                }}
                onClick={() => handleItemClick(item)}
                className="group flex items-center gap-3 rounded-full bg-card/95 px-4 py-2.5 shadow-lg shadow-emerald-500/10 backdrop-blur-xl border border-border/50 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/15 hover:-translate-x-1"
              >
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {t(item.labelKey, lang)}
                </span>
                <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25 transition-transform duration-200 group-hover:scale-110">
                  <item.icon className="size-4" />
                </div>
              </motion.button>
            ))}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          onClick={toggleFAB}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30 transition-shadow duration-200 hover:shadow-2xl hover:shadow-emerald-500/40"
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Plus className="size-6" />
          </motion.div>
        </motion.button>
      </div>
    </>
  )
}

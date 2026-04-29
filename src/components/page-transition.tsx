"use client"

import { motion, AnimatePresence } from "framer-motion"
import { fadeInUp } from "@/lib/animations"

export function PageTransition({ children, viewKey }: { children: React.ReactNode; viewKey: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        variants={fadeInUp}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

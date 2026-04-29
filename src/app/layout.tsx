import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { PWARegister } from "@/components/pwa-register"
import { ColorThemeSync } from "@/components/color-theme-sync"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "TaskNotes Ultimate - Tasks & Habits Manager",
  description:
    "A comprehensive task management, habit tracking, and pomodoro timer application built with modern web technologies.",
  keywords: [
    "TaskNotes",
    "task manager",
    "habit tracker",
    "pomodoro timer",
    "productivity",
    "Next.js",
    "TypeScript",
  ],
  authors: [{ name: "TaskNotes Team" }],
  openGraph: {
    title: "TaskNotes Ultimate",
    description: "Tasks & Habits Manager with Pomodoro Timer",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TaskNotes",
  },
}

export const viewport: Viewport = {
  themeColor: "#10b981",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TaskNotes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <PWARegister />
          <ColorThemeSync />
        </ThemeProvider>
      </body>
    </html>
  )
}

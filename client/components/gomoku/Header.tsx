"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "@/components/theme-provider"
import { Moon, Sun, Settings } from "lucide-react"
import type { ConnectionStatus } from "@/lib/adapters/gameClient"

interface HeaderProps {
  connectionStatus: ConnectionStatus
  onSettingsClick: () => void
}

export function Header({ connectionStatus, onSettingsClick }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const statusColors = {
    connecting: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
    online: "bg-green-500/20 text-green-600 dark:text-green-400",
    offline: "bg-gray-500/20 text-gray-600 dark:text-gray-400",
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <h1 className="text-xl font-bold">Gomoku</h1>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={statusColors[connectionStatus]}
          >
            {connectionStatus === "connecting" && "Connecting"}
            {connectionStatus === "online" && "Online"}
            {connectionStatus === "offline" && "Offline"}
          </Badge>

          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}


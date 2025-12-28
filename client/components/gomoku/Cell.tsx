"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { Stone } from "@/lib/gomoku/types"

interface CellProps {
  stone: Stone
  row: number
  col: number
  isLastMove: boolean
  showCoordinates: boolean
  onCellClick: (row: number, col: number) => void
  onCellHover?: (row: number, col: number) => void
  hoverStone?: Stone | null
}

export function Cell({
  stone,
  row,
  col,
  isLastMove,
  showCoordinates,
  onCellClick,
  onCellHover,
  hoverStone,
}: CellProps) {
  const displayStone = hoverStone || stone

  return (
    <button
      className={cn(
        "relative flex items-center justify-center aspect-square border border-border/50 transition-colors",
        "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isLastMove && "ring-2 ring-primary ring-offset-1"
      )}
      onClick={() => onCellClick(row, col)}
      onMouseEnter={() => onCellHover?.(row, col)}
      onMouseLeave={() => {
        if (onCellHover) {
          onCellHover(-1, -1)
        }
      }}
      aria-label={`Cell ${row + 1}, ${col + 1}`}
    >
      {displayStone && (
        <div
          className={cn(
            "absolute rounded-full shadow-md transition-all",
            displayStone === "black"
              ? "bg-black dark:bg-gray-900"
              : "bg-white dark:bg-gray-100",
            hoverStone && !stone ? "opacity-50 scale-90" : "scale-100"
          )}
          style={{
            width: "75%",
            height: "75%",
          }}
        />
      )}
      {showCoordinates && (
        <span className="absolute text-[0.5rem] text-muted-foreground opacity-30 pointer-events-none">
          {col === 0 && String(row + 1)}
          {row === 0 && String.fromCharCode(65 + col)}
        </span>
      )}
    </button>
  )
}


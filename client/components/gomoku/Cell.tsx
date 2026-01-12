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
  isForbidden?: boolean
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
  isForbidden = false,
}: CellProps) {
  const displayStone = hoverStone || stone

  // log if cell is forbidden
  React.useEffect(() => {
    if (!isForbidden) return;
    console.log(`Cell at [${row}, ${col}] is forbidden.`, row, col);
  }, [isForbidden]);

  return (
    <button
      className={cn(
        "relative flex items-center justify-center aspect-square border border-border/50 transition-all duration-200",
        "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isLastMove && "ring-2 ring-primary ring-offset-1",
        isForbidden && !stone && "hover:bg-red-200/50 dark:hover:bg-red-800/30 cursor-not-allowed"
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
      {isForbidden && !stone && (
        <div className="absolute inset-0 bg-red-100/50 dark:bg-red-900/20 rounded-md transition-all duration-300 ease-in-out hover:inset-1" />
      )}
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
      {isForbidden && !stone && (
        <div className="absolute text-red-500 dark:text-red-600 font-bold text-lg select-none pointer-events-none">
          ✕
        </div>
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


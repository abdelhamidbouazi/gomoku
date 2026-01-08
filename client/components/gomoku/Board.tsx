"use client"

import * as React from "react"
import { Cell } from "./Cell"
import type { Stone, Move } from "@/lib/gomoku/types"

interface BoardProps {
  board: Stone[][]
  lastMove: Move | null
  currentPlayer: "black" | "white"
  showCoordinates: boolean
  onCellClick: (row: number, col: number) => void
  disabled?: boolean
}

export function Board({
  board,
  lastMove,
  currentPlayer,
  showCoordinates,
  onCellClick,
  disabled = false,
}: BoardProps) {
  const [hoveredCell, setHoveredCell] = React.useState<{
    row: number
    col: number
  } | null>(null)

  const handleCellHover = React.useCallback(
    (row: number, col: number) => {
      if (disabled || row < 0 || col < 0) {
        setHoveredCell(null)
        return
      }
      if (board[row]?.[col] === null) {
        setHoveredCell({ row, col })
      } else {
        setHoveredCell(null)
      }
    },
    [board, disabled]
  )

  const size = board.length
  const maxSize = Math.min(
    typeof window !== "undefined" ? window.innerWidth - 64 : 600,
    typeof window !== "undefined" ? window.innerHeight - 200 : 600
  )
  const cellSize = Math.floor(maxSize / size)

  return (
    <div className="flex items-center justify-center p-4">
      <div
        className="grid gap-0 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-900/50 rounded-lg p-2 shadow-lg"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          width: `${cellSize * size + 16}px`,
          maxWidth: "100%",
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((stone, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              stone={stone}
              row={rowIndex}
              col={colIndex}
              isLastMove={
                lastMove?.row === rowIndex && lastMove?.col === colIndex
              }
              showCoordinates={showCoordinates}
              onCellClick={onCellClick}
              onCellHover={handleCellHover}
              hoverStone={
                hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex
                  ? currentPlayer
                  : null
              }
            />
          ))
        )}
      </div>
    </div>
  )
}


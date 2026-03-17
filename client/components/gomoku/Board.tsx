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
  forbiddenMoves?: Array<[number, number]>
}

export function Board({
  board,
  lastMove,
  currentPlayer,
  showCoordinates,
  onCellClick,
  disabled = false,
  forbiddenMoves = [],
}: BoardProps) {
  const [hoveredCell, setHoveredCell] = React.useState<{
    row: number
    col: number
  } | null>(null)

  React.useEffect(() => {
    console.log("Forbidden moves updated:", forbiddenMoves)
    console.log("Forbidden moves length:", forbiddenMoves?.length)
    if (forbiddenMoves && forbiddenMoves.length > 0) {
      console.log("Forbidden cells:", forbiddenMoves)
    }
  }, [forbiddenMoves])

  // Check if a cell is in the forbidden moves list
  const isCellForbidden = React.useCallback(
    (row: number, col: number): boolean => {
      if (!forbiddenMoves || forbiddenMoves.length === 0) {
        return false
      }
      
      const result = forbiddenMoves.some((cell) => {
        // Handle both array [x, y] and object {0: x, 1: y} formats
        if (Array.isArray(cell)) {
          const [x, y] = cell
          const matches = x === col && y === row
          if (matches) {
            console.log(`Cell [${row}, ${col}] is forbidden! Matched [${x}, ${y}]`)
          }
          return matches
        } else if (typeof cell === "object" && cell !== null) {
          const x = (cell as any)[0]
          const y = (cell as any)[1]
          const matches = x === col && y === row
          if (matches) {
            console.log(`Cell [${row}, ${col}] is forbidden! Matched object [${x}, ${y}]`)
          }
          return matches
        }
        console.warn("Invalid forbidden cell format:", cell)
        return false
      })
      
      return result
    },
    [forbiddenMoves]
  )

  const handleCellHover = React.useCallback(
    (row: number, col: number) => {
      if (disabled || row < 0 || col < 0) {
        setHoveredCell(null)
        return
      }
      // Don't allow hover on forbidden cells
      if (isCellForbidden(row, col)) {
        setHoveredCell(null)
        return
      }
      if (board[row]?.[col] === null) {
        setHoveredCell({ row, col })
      } else {
        setHoveredCell(null)
      }
    },
    [board, disabled, isCellForbidden]
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
              isForbidden={isCellForbidden(rowIndex, colIndex)}
            />
          ))
        )}
      </div>
    </div>
  )
}


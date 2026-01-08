"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { formatCoordinate } from "@/lib/gomoku/game"
import type { Move } from "@/lib/gomoku/types"

interface MoveListProps {
  moves: Move[]
  lastMove: Move | null
}

export function MoveList({ moves, lastMove }: MoveListProps) {
  return (
    <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
      {moves.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No moves yet
        </p>
      ) : (
        moves.map((move, index) => {
          const isLast = lastMove?.row === move.row && lastMove?.col === move.col
          return (
            <div
              key={index}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                isLast
                  ? "bg-primary/10 text-primary font-medium"
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              <span className="font-mono">
                {move.player === "black" ? "B" : "W"}: {formatCoordinate(move.row, move.col)}
              </span>
              {isLast && (
                <span className="text-xs text-muted-foreground">Last</span>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}


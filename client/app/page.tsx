"use client"

import * as React from "react"
import { Header } from "@/components/gomoku/Header"
import { Board } from "@/components/gomoku/Board"
import { RightPanel } from "@/components/gomoku/RightPanel"
import { SettingsDialog } from "@/components/gomoku/SettingsDialog"
import { EndgameDialog } from "@/components/gomoku/EndgameDialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/toast"
import { gameClient } from "@/lib/adapters/gameClient"
import {
  createBoard,
  placeMove,
  checkWin,
  createMove,
  undoMove,
} from "@/lib/gomoku/game"
import type {
  GameState,
  GameMode,
  GameSettings,
  Player,
} from "@/lib/gomoku/types"

const defaultSettings: GameSettings = {
  boardSize: 15,
  showCoordinates: false,
  soundEnabled: false,
  aiDifficulty: 3,
}

const defaultPlayers = {
  black: { id: "1", name: "Player 1", color: "black" as const },
  white: { id: "2", name: "Player 2", color: "white" as const },
}

export default function Home() {
  const { toast } = useToast()
  const [settings, setSettings] = React.useState<GameSettings>(defaultSettings)
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [connectionStatus, setConnectionStatus] =
    React.useState<"connecting" | "online" | "offline">("offline")
  const [mode, setMode] = React.useState<GameMode>("local")
  const [gameState, setGameState] = React.useState<GameState>(() => ({
    board: createBoard(defaultSettings.boardSize),
    currentPlayer: "black",
    moves: [],
    lastMove: null,
    status: "waiting",
    winner: null,
    boardSize: defaultSettings.boardSize,
    mode: "local",
    players: defaultPlayers,
  }))

  React.useEffect(() => {
    const unsubscribe = gameClient.onStatusChange(setConnectionStatus)
    return unsubscribe
  }, [])

  React.useEffect(() => {
    if (mode === "online") {
      gameClient.connect(mode)
    } else {
      gameClient.disconnect()
    }
  }, [mode])

  const resetGame = React.useCallback(() => {
    setGameState({
      board: createBoard(settings.boardSize),
      currentPlayer: "black",
      moves: [],
      lastMove: null,
      status: "playing",
      winner: null,
      boardSize: settings.boardSize,
      mode,
      players: defaultPlayers,
    })
  }, [settings.boardSize, mode])

  React.useEffect(() => {
    if (settings.boardSize !== gameState.boardSize) {
      resetGame()
    }
  }, [settings.boardSize, gameState.boardSize, resetGame])

  const handleCellClick = React.useCallback(
    (row: number, col: number) => {
      if (gameState.status !== "playing") {
        return
      }

      if (gameState.board[row][col] !== null) {
        toast("Invalid move: Cell is already occupied", "destructive")
        return
      }

      const result = placeMove(
        gameState.board,
        row,
        col,
        gameState.currentPlayer
      )

      if (!result.success) {
        toast("Invalid move", "destructive")
        return
      }

      const move = createMove(row, col, gameState.currentPlayer)
      const newMoves = [...gameState.moves, move]
      const hasWon = checkWin(result.board, row, col, gameState.currentPlayer)

      setGameState((prev) => ({
        ...prev,
        board: result.board,
        currentPlayer: prev.currentPlayer === "black" ? "white" : "black",
        moves: newMoves,
        lastMove: move,
        winner: hasWon ? prev.currentPlayer : null,
        status: hasWon ? "finished" : "playing",
      }))

      // TODO: For AI mode, make AI move after player move
      // TODO: For online mode, send move to server
    },
    [gameState, toast]
  )

  const handleUndo = React.useCallback(() => {
    if (mode === "online" || gameState.moves.length === 0) {
      return
    }

    const { board: newBoard, newMoves } = undoMove(
      gameState.board,
      gameState.moves
    )

    setGameState((prev) => ({
      ...prev,
      board: newBoard,
      moves: newMoves,
      lastMove: newMoves.length > 0 ? newMoves[newMoves.length - 1] : null,
      currentPlayer:
        newMoves.length % 2 === 0 ? "black" : "white",
      status: "playing",
      winner: null,
    }))
  }, [gameState, mode])

  const handleRestart = React.useCallback(() => {
    resetGame()
  }, [resetGame])

  const handleResign = React.useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: "finished",
      winner: prev.currentPlayer === "black" ? "white" : "black",
    }))
  }, [])

  const handleModeChange = React.useCallback((newMode: GameMode) => {
    setMode(newMode)
    resetGame()
  }, [resetGame])

  const handleSettingsChange = React.useCallback(
    (newSettings: Partial<GameSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }))
    },
    []
  )

  const showEndgameDialog =
    gameState.status === "finished" && gameState.winner !== null

  if (gameState.status === "waiting") {
    return (
      <div className="flex flex-col min-h-screen">
        <Header
          connectionStatus={connectionStatus}
          onSettingsClick={() => setSettingsOpen(true)}
        />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 text-center">
                <h2 className="text-2xl font-bold">Start a Match</h2>
                <p className="text-muted-foreground">
                  Choose a game mode to begin
                </p>
                <div className="flex flex-col gap-2 pt-4">
                  <Button
                    onClick={() => {
                      setMode("local")
                      setGameState((prev) => ({ ...prev, status: "playing" }))
                    }}
                  >
                    Local PvP
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMode("ai")
                      setGameState((prev) => ({ ...prev, status: "playing" }))
                    }}
                  >
                    vs AI
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMode("online")
                      setGameState((prev) => ({ ...prev, status: "playing" }))
                    }}
                  >
                    Online
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
        <SettingsDialog
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          mode={mode}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        connectionStatus={connectionStatus}
        onSettingsClick={() => setSettingsOpen(true)}
      />
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 p-4 container mx-auto">
        <div className="flex items-center justify-center min-h-0">
          <Board
            board={gameState.board}
            lastMove={gameState.lastMove}
            currentPlayer={gameState.currentPlayer}
            showCoordinates={settings.showCoordinates}
            onCellClick={handleCellClick}
            disabled={gameState.status !== "playing"}
          />
        </div>
        <div className="lg:flex lg:flex-col lg:items-end">
          <RightPanel
            gameState={gameState}
            mode={mode}
            onModeChange={handleModeChange}
            onUndo={handleUndo}
            onRestart={handleRestart}
            onResign={handleResign}
          />
        </div>
      </main>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={handleSettingsChange}
        mode={mode}
      />
      <EndgameDialog
        open={showEndgameDialog}
        onOpenChange={(open) => {
          if (!open) {
            setGameState((prev) => ({ ...prev, status: "waiting" }))
          }
        }}
        gameState={gameState}
        onNewGame={() => {
          resetGame()
        }}
      />
    </div>
  )
}

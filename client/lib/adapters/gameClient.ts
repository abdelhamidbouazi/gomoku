import type { GameMode, GameState, Player } from "../gomoku/types"

export type ConnectionStatus = "connecting" | "online" | "offline"

// TODO: Replace with actual socket/API integration
class GameClient {
  private status: ConnectionStatus = "offline"
  private listeners: ((status: ConnectionStatus) => void)[] = []

  connect(mode: GameMode): Promise<void> {
    // TODO: Implement socket connection
    return new Promise((resolve) => {
      this.status = "connecting"
      this.notifyListeners()

      setTimeout(() => {
        if (mode === "online") {
          this.status = "online"
        } else {
          this.status = "offline"
        }
        this.notifyListeners()
        resolve()
      }, 500)
    })
  }

  disconnect(): void {
    // TODO: Implement socket disconnection
    this.status = "offline"
    this.notifyListeners()
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.status))
  }

  // TODO: Implement actual API calls
  async makeMove(
    gameId: string,
    row: number,
    col: number
  ): Promise<{ success: boolean; error?: string }> {
    // Mock implementation
    return { success: true }
  }

  async joinGame(gameId: string): Promise<GameState | null> {
    // Mock implementation
    return null
  }

  async createGame(mode: GameMode): Promise<{ gameId: string; state: GameState } | null> {
    // Mock implementation
    return null
  }

  async getOpponent(gameId: string): Promise<Player | null> {
    // Mock implementation
    return null
  }
}

export const gameClient = new GameClient()


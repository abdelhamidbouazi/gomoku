## Gomoku

Modern full‑stack Gomoku with a Python AI: iterative‑deepening **Minimax + Alpha‑Beta pruning**, **move ordering**, and a simple **transposition table**, served by a Rust Socket.IO backend and a Next.js UI.

### Highlights

- **Game modes**: local 1v1, vs AI (PvE)
- **AI algorithms**: iterative deepening, minimax, alpha‑beta pruning, move ordering, transposition table, pattern/heuristic evaluation
- **Backend**: Rust (Axum + Tokio) + `socketioxide` (Socket.IO)
- **Frontend**: Next.js App Router + React + TypeScript + Tailwind + shadcn/ui
- **Bridge**: Rust ↔ Python AI over JSON stdin/stdout (`python3 -m ai.bridge`)

### Architecture

- **Client** (`client/`): renders the board UI and talks to the server via Socket.IO
- **Server** (`src/`): authoritative game state, validation, captures/win logic, emits events
- **AI** (`ai/`): Python engine that selects moves from a board snapshot
- **Bridge** (`src/bridge.rs`, `ai/bridge.py`): spawns Python, exchanges JSON payloads

Event flow (PvE):

1. client emits `game-start` with mode `PvE`
2. client emits `player-move`
3. server applies move, emits `board-cell`, updates `game-turn`
4. server asks Python AI for a move, then emits the AI `board-cell` + `game-turn`

### AI details (Python)

Core ideas:

- **Iterative deepening** under a time budget
- **Minimax** with **alpha‑beta pruning**
- **Move ordering** to increase pruning rate
- **Transposition table** keyed by board + capture counts + side to move + depth
- **Heuristic evaluation** for non-terminal positions

Entry point used by the server:

- `ai/ai.py`: `choose_best_move(board, max_depth, ai_captures, opponent_captures, time_limit_ms)`

Search implementation:

- `ai/search.py`: minimax + alpha‑beta + ordering + transposition table

### Quickstart (Docker)

Build and run the server:

```bash
docker compose up --build server
```

Server listens on `http://localhost:8000`.

### Local development

#### 1) Backend (Rust server)

```bash
cargo run -- --port 8000 --board-size 19
```

#### 2) Frontend (Next.js)

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:3000`.

The client connects to the server via:

- `NEXT_PUBLIC_SOCKET_URL` (defaults to `http://localhost:8000`)

### Repo layout

```text
.
├─ ai/                 # Python AI engine + JSON bridge entrypoint
├─ src/                # Rust server (Socket.IO events, game state, bridge)
├─ client/             # Next.js UI
├─ Dockerfile          # Server image (includes python3 + ai/)
└─ docker-compose.yml  # Server compose
```

### Notes

- The bridge currently assumes a **19×19** board (see `src/bridge.rs`).
- The UI includes an `/about` page listing tech stack, contributors, and rules.

### Credits

- Abdelhamid Bouazi (`abouaz`)
- Samy Tamim (`stamim`)


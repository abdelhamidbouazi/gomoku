# Gomoku

**Five in a row. Capture to win. Play against a search-based AI.**

A full-stack Gomoku game built with a **Rust game server**, a **Python AI engine**, and a **Next.js interface**. Play locally with a friend, challenge the AI, or watch two AIs compete on a 19 × 19 board.

[Getting started](#getting-started) · [Game rules](#game-rules) · [AI engine](#ai-engine) · [Development](#development) · [Troubleshooting](#troubleshooting)

## Features

- **Three game modes:** local player versus player, player versus AI, and AI versus AI.
- **Capture-based gameplay:** win through a line of five or by capturing five pairs.
- **AI move suggestions:** request a hint for the current player's turn.
- **Undo and move history:** revisit moves and follow the progress of a game.
- **Live board updates:** Socket.IO carries moves, captures, turns, and game results.
- **Server-side rules:** Rust validates moves and maintains each connected client's game session.

## Getting started

### Prerequisites

| Tool | Purpose |
| --- | --- |
| Rust with Cargo, supporting edition 2024 | Build and run the game server |
| Python 3.10+ available as `python3` | Run the AI engine; no third-party Python packages required |
| Node.js 24 and npm | Run the frontend; matches the client Docker image |
| Git | Clone the repository |

### 1. Clone the project

```bash
git clone git@github.com:abdelhamidbouazi/gomoku.git
cd gomoku
```

### 2. Start the game server

Run this from the repository root so the server can find the Python AI module:

```bash
cargo run --release -- --port 8000 --board-size 19
```

Keep this terminal open. The server listens on `http://localhost:8000`.

### 3. Start the frontend

In a second terminal, from the repository root:

```bash
cd client
npm ci
npm run dev
```

Open **[localhost:3000](http://localhost:3000)**, select a game mode, and start playing.

> Use a 19 × 19 board for the full application. The Python bridge requires this size, including for AI hints.

## Run with Docker

The repository includes images for both services. The checked-in Compose file has its port mappings commented out, so add a local override to expose them:

```bash
cat > compose.local.yaml <<'YAML'
services:
  server:
    ports:
      - "8000:8000"
  client:
    ports:
      - "3000:3000"
YAML

docker compose -f docker-compose.yml -f compose.local.yaml up --build -d
```

Open **[localhost:3000](http://localhost:3000)** once both services are ready. This setup includes Rust, Python, and Node.js inside the images; only Docker with Compose is required on the host.

View logs or stop the application with the same Compose files:

```bash
docker compose -f docker-compose.yml -f compose.local.yaml logs -f
docker compose -f docker-compose.yml -f compose.local.yaml down
```

The client image builds with `http://localhost:8000` as its browser-facing server URL. For access from another machine, update the build-stage `NEXT_PUBLIC_SOCKET_URL` in `client/Dockerfile` to a reachable server address and rebuild the client image.

## Game rules

This implementation adds captures and move restrictions to five-in-a-row Gomoku:

1. **Take turns placing stones** on empty intersections. Black plays first.
2. **Make a line of five** horizontally, vertically, or diagonally. A capturable line may require surviving the opponent's capture response before the win is confirmed.
3. **Capture opposing pairs** by bracketing two adjacent enemy stones between your own stones. Captured stones leave the board.
4. **Capture five pairs to win**—ten opposing stones in total.
5. **Respect move restrictions:** the server rejects suicide moves that place a stone into an immediately capturable pair and double-three moves. A move that also captures opposing stones is exempt from the double-three restriction.

Local PvP uses one shared board in one browser session. The server creates a separate game session for each connection; this is not a shared online matchmaking lobby.

## AI engine

The AI searches candidate moves rather than using a trained model or an external API.

| Technique | Role |
| --- | --- |
| Iterative deepening | Searches progressively deeper within a time budget |
| Minimax with alpha-beta pruning | Evaluates competing moves while pruning branches |
| Move ordering | Prioritizes promising moves to improve pruning |
| Transposition table | Reuses position evaluations during search |
| Heuristic evaluation | Scores non-terminal positions using board patterns and captures |
| Tactical checks | Looks for immediate wins and opposing winning threats |

Defaults in [`ai/constants.py`](ai/constants.py) are a **maximum depth of 10** and a **450 ms search budget**. These are search settings, not a guaranteed end-to-end response time; bridge startup and other processing add overhead.

The main entry point is `choose_best_move()` in [`ai/ai.py`](ai/ai.py). The JSON bridge normalizes stone colors for the engine and can return a legal fallback move when no preferred move is available.

For a deeper walkthrough, see [`ai/ai.md`](ai/ai.md) and the [learning materials](lessons/).

## Architecture

| Layer | Stack | Responsibility |
| --- | --- | --- |
| Browser | Next.js 16, React 19, TypeScript, Tailwind CSS 4 | Board, controls, settings, and game feedback |
| Game server | Rust, Axum, Tokio, socketioxide | Sessions, move validation, captures, and win detection |
| AI engine | Python standard library | Legal-move generation, evaluation, and search |

The browser sends Socket.IO events to Rust. The server validates and applies moves, then broadcasts board and turn updates to the connected client. When an AI move or hint is needed, Rust launches `python3 -m ai.bridge` and exchanges JSON through stdin and stdout.

```text
.
├── ai/                  # Search engine, rules, evaluation, and Python bridge
├── client/              # Next.js app and Socket.IO client adapter
│   ├── app/             # Game page, about page, and optional sound API route
│   ├── components/      # Board, controls, dialogs, and UI primitives
│   └── lib/             # Game types, socket adapter, and sound helpers
├── src/                 # Rust game server
│   ├── bridge.rs        # Python subprocess protocol
│   ├── events/          # Socket.IO request and response events
│   ├── game/            # Sessions, state, captures, and win logic
│   └── shared/          # CLI configuration and shared types
├── lessons/             # AI learning materials
├── Dockerfile           # Rust server image with Python runtime
└── docker-compose.yml   # Server and frontend services
```

## Configuration

For local development, create `client/.env.local` only if you need to override the defaults:

```dotenv
NEXT_PUBLIC_SOCKET_URL=http://localhost:8000
# Optional: enables sound previews fetched through the Next.js API route.
# FREESOUND_API_KEY=your_key_here
```

| Setting | Default | Notes |
| --- | --- | --- |
| Server `--port` | `8000` | Change the client socket URL to match |
| Server `--board-size` | `19` | Keep at 19 when using the Python engine |
| `NEXT_PUBLIC_SOCKET_URL` | `http://localhost:8000` | Must be reachable from the user's browser |
| `FREESOUND_API_KEY` | Unset | Optional server-side key for sound previews |

Restart the development server after changing environment variables. Public Next.js variables are embedded during production builds, so rebuild the frontend when changing its socket URL. Keep API keys out of version control.

## Development

Run backend checks and the Python scenario runner from the repository root:

```bash
cargo check
cargo test
python3 -m ai.test
```

The Python runner prints `PASS`, `FAIL`, or `ERROR` for each scenario. Inspect its output: it catches failures and does not reliably signal them through a nonzero exit code.

Run frontend checks from `client/`:

```bash
npm run lint
npm run build
```

To serve the production frontend after building it:

```bash
npm run start
```

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| The interface cannot connect | Start the Rust server and verify `NEXT_PUBLIC_SOCKET_URL` matches its address and port |
| Docker runs but the app is unreachable | Use the port override above; the checked-in Compose file does not publish ports |
| AI moves or hints fail | Ensure `python3` is on `PATH`, start Rust from the repository root, and use a 19 × 19 board |
| Another device cannot connect | `localhost` refers to that device; use the server machine's reachable address and rebuild the production client |
| Sound previews fail | Configure `FREESOUND_API_KEY` for the Next.js server and check the API route logs |

## Contributors

- **Abdelhamid Bouazi** — `abouazi`
- **Samy Tamim** — `stamim`

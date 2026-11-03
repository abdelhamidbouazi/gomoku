# Gomoku AI: A Complete Deep Dive

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Core Concepts](#core-concepts)
4. [The Search Algorithm: Minimax with Alpha-Beta Pruning](#the-search-algorithm)
5. [Board Evaluation: The Heuristic Function](#board-evaluation)
6. [Game Rules Implementation](#game-rules)
7. [Move Optimization Techniques](#move-optimization)
8. [How It All Works Together](#putting-it-all-together)
9. [Performance Considerations](#performance)

---

## Introduction

This AI implements a competitive Gomoku (Five-in-a-Row) player with capture rules. Gomoku is a strategy board game played on a 19×19 grid where two players alternate placing stones. The goal is to create an unbroken line of five stones (horizontally, vertically, or diagonally).

**Special Rules in This Implementation:**
- **Captures**: If you create a pattern of `X-O-O-X`, you capture the two opponent stones
- **Double-Three Rule**: You cannot create two "free threes" (open-ended three-in-a-rows) with one move
- **Capture Win**: Capturing 10 or more opponent stones wins the game
- **Breakable Five**: A five-in-a-row can be broken by capturing one of its stones

---

## Architecture Overview

The AI is organized into focused modules, each handling a specific responsibility:

```
ai/
├── ai.py           # Main entry point - chooses the best move
├── search.py       # Minimax algorithm with alpha-beta pruning
├── heuristic.py    # Board evaluation (scoring positions)
├── rules.py        # Game rules (legal moves, winning conditions)
├── captures.py     # Capture mechanics with undo support
├── board.py        # Board utilities and helpers
├── constants.py    # Shared constants
└── types.py        # Type definitions
```

**Design Philosophy:**
- **Separation of Concerns**: Each file has one clear job
- **Testability**: Pure functions that can be tested independently
- **Undo-Friendly**: All moves can be applied and undone (critical for search)
- **Performance**: Optimized for speed without sacrificing clarity

---

## Core Concepts

### 1. Board Representation

The board is a simple 2D list (19×19):

```python
Board = List[List[int]]

# Cell values:
EMPTY = 0           # Empty cell
AI_PLAYER = 1       # AI's stone
OPPONENT_PLAYER = 2 # Human's stone
```

**Why a 2D list?**
- Simple and intuitive: `board[y][x]` mirrors visual representation
- Fast access: O(1) lookups
- Easy to copy for undo operations

### 2. Move Representation

A move is simply a coordinate tuple:

```python
Move = Tuple[int, int]  # (x, y)
```

### 3. Captures Dictionary

Captures are tracked separately:

```python
captures = {
    AI_PLAYER: 0,        # AI's capture count
    OPPONENT_PLAYER: 0   # Opponent's capture count
}
```

---

## The Search Algorithm: Minimax with Alpha-Beta Pruning

### What is Minimax?

Minimax is a decision-making algorithm used in two-player games. It works by:

1. **Maximizing Player (AI)**: Tries to maximize the score
2. **Minimizing Player (Opponent)**: Tries to minimize the score (from AI's perspective)

The algorithm recursively explores possible future moves, alternating between maximizing and minimizing layers.

### Visual Example

```
                    [AI's turn - MAX]
                    /       |       \
                Move A    Move B    Move C
                  /          |          \
        [Opponent - MIN] [Opponent] [Opponent]
           /    \          /    \      /    \
        ...    ...      ...    ...  ...    ...
```

At each level:
- **MAX nodes**: AI picks the move with the highest score
- **MIN nodes**: Opponent picks the move with the lowest score (worst for AI)

### Alpha-Beta Pruning: The Speed Boost

Alpha-beta pruning is an optimization that skips exploring branches that can't possibly affect the final decision.

**Key Idea:**
- `alpha`: Best score MAX player can guarantee (starts at -∞)
- `beta`: Best score MIN player can guarantee (starts at +∞)
- If `beta ≤ alpha`, stop searching this branch (it won't be chosen)

**Example:**
```
MAX node (alpha=-∞, beta=+∞)
├─ Move A: returns score = 5
│  (alpha becomes 5)
└─ Move B: 
   ├─ First child returns -2
   │  (beta becomes -2)
   └─ PRUNE! -2 ≤ 5, so parent won't choose Move B
      (no need to explore remaining children)
```

**The Code:**

```python
def minimax(
    board: Board,
    captures: Dict[int, int],
    depth: int,
    alpha: float,
    beta: float,
    maximizing: bool,
    start_time: float,
    time_limit_ms: int,
    stats: SearchStats,
    table: Dict[Tuple, float],
) -> float:
    # Count this node for statistics
    stats.nodes += 1
    
    # Time check - stop if we're running out of time
    elapsed_ms = (perf_counter() - start_time) * 1000.0
    if elapsed_ms >= time_limit_ms:
        return evaluate_board(board, captures)
    
    # Base cases:
    # 1. Game is over (someone won)
    terminal = get_terminal_score(board, captures)
    if terminal is not None:
        return terminal
    
    # 2. Maximum depth reached (leaf node)
    if depth == 0:
        return evaluate_board(board, captures)
    
    # Check transposition table (have we seen this position before?)
    current_player = AI_PLAYER if maximizing else OPPONENT_PLAYER
    key = (board_key(board), captures[AI_PLAYER], 
           captures[OPPONENT_PLAYER], current_player, depth)
    if key in table:
        return table[key]
    
    # Get and order legal moves (better moves first = more pruning)
    moves = get_legal_moves(board, current_player, captures)
    if not moves:
        value = evaluate_board(board, captures)
        table[key] = value
        return value
    
    moves = order_moves(board, captures, current_player, moves)
    
    # MAXIMIZING player (AI)
    if maximizing:
        best_score = float("-inf")
        
        for x, y in moves:
            # Try this move
            history = apply_move_with_captures(board, x, y, AI_PLAYER, captures)
            
            # Recurse to opponent's turn (minimize)
            score = minimax(board, captures, depth - 1, alpha, beta, 
                          False, start_time, time_limit_ms, stats, table)
            
            # Undo the move
            undo_move_with_captures(board, captures, AI_PLAYER, history)
            
            # Update best score
            if score > best_score:
                best_score = score
            
            # Update alpha (best score we can guarantee)
            if best_score > alpha:
                alpha = best_score
            
            # Prune if beta ≤ alpha
            if beta <= alpha:
                stats.cutoffs += 1
                break  # No need to explore remaining moves
        
        table[key] = best_score
        return best_score
    
    # MINIMIZING player (Opponent) - similar but inverted logic
    else:
        best_score = float("inf")
        
        for x, y in moves:
            history = apply_move_with_captures(board, x, y, OPPONENT_PLAYER, captures)
            score = minimax(board, captures, depth - 1, alpha, beta, 
                          True, start_time, time_limit_ms, stats, table)
            undo_move_with_captures(board, captures, OPPONENT_PLAYER, history)
            
            if score < best_score:
                best_score = score
            
            if best_score < beta:
                beta = best_score
            
            if beta <= alpha:
                stats.cutoffs += 1
                break
        
        table[key] = best_score
        return best_score
```

### Iterative Deepening

Instead of searching to a fixed depth, the AI uses **iterative deepening**:

1. Search depth 1
2. Search depth 2
3. Search depth 3
4. ...continue until time runs out

**Why?**
- **Time control**: Guarantees a move within time limit
- **Move ordering improvement**: Results from shallower searches help order deeper searches
- **Anytime algorithm**: Always has a valid move ready

```python
for depth in range(1, max_depth + 1):
    # Check time
    if elapsed_ms >= time_limit_ms:
        break
    
    # Search at this depth
    for x, y in legal_moves:
        if elapsed_ms >= time_limit_ms:
            break
        
        # Try move and get score at current depth
        score = minimax(board, captures, depth - 1, ...)
        
        # Update best if better
        if score > current_best_score:
            current_best_move = (x, y)
    
    # Save this depth's results
    if current_best_move is not None:
        best_move = current_best_move
        depth_reached = depth
```

---

## Board Evaluation: The Heuristic Function

The heuristic function scores a board position when we can't search deeper. It's the AI's "intuition."

### Pattern Scoring

The AI evaluates consecutive stone patterns:

```python
def pattern_score(length: int, open_ends: int) -> float:
    """
    Score a consecutive line segment.
    
    length: Number of consecutive stones (1-5+)
    open_ends: Number of empty cells at the ends (0, 1, or 2)
    """
    if length >= 5:
        return 50_000.0  # Five-in-a-row is huge!
    
    # Base values for different lengths
    values = {
        1: 3,      # Single stone
        2: 25,     # Two in a row
        3: 220,    # Three in a row
        4: 4_000,  # Four in a row (very dangerous!)
    }
    
    base = values.get(length, 0)
    if base == 0:
        return 0.0
    
    # Open ends make patterns much stronger
    if open_ends == 2:
        return float(base)        # Fully open (best)
    if open_ends == 1:
        return float(base) * 0.35 # Half-open
    return float(base) * 0.08     # Closed (worst)
```

**Why Open Ends Matter:**

```
Fully Open:    _ X X X _     (can extend either way)
Half-Open:     # X X X _     (can extend one way)
Closed:        # X X X #     (can't extend - much weaker)
```

### Scoring a Player

```python
def score_player(board: Board, player: int) -> float:
    """
    Find all patterns for a player and sum their scores.
    """
    total = 0.0
    
    # Check every cell
    for y in range(BOARD_SIZE):
        for x in range(BOARD_SIZE):
            if board[y][x] != player:
                continue
            
            # Check each direction (horizontal, vertical, 2 diagonals)
            for dx, dy in DIRECTIONS:
                # Only count each streak once (from its start)
                prev_x, prev_y = x - dx, y - dy
                if is_in_bounds(prev_x, prev_y) and board[prev_y][prev_x] == player:
                    continue  # This streak starts earlier
                
                # Count consecutive stones in this direction
                length = 0
                cx, cy = x, y
                while is_in_bounds(cx, cy) and board[cy][cx] == player:
                    length += 1
                    cx += dx
                    cy += dy
                
                # Check if ends are open
                left_cell = get_cell(board, x - dx, y - dy)
                right_cell = get_cell(board, x + length * dx, y + length * dy)
                
                open_ends = 0
                if left_cell == EMPTY:
                    open_ends += 1
                if right_cell == EMPTY:
                    open_ends += 1
                
                # Add score for this pattern
                total += pattern_score(length, open_ends)
    
    return total
```

### Complete Board Evaluation

```python
def evaluate_board(board: Board, captures: Dict[int, int]) -> float:
    """
    Overall board score from AI's perspective.
    Positive = good for AI, negative = good for opponent.
    """
    # Pattern difference
    score = score_player(board, AI_PLAYER) - score_player(board, OPPONENT_PLAYER)
    
    # Capture bonus (1200 points per pair captured)
    score += captures[AI_PLAYER] * 1200
    score -= captures[OPPONENT_PLAYER] * 1200
    
    return score
```

---

## Game Rules Implementation

### 1. Five-in-a-Row Detection

```python
def check_five_in_a_row(board: Board, x: int, y: int, player: int) -> bool:
    """
    Check if the stone at (x, y) is part of a 5+ stone line.
    """
    for dx, dy in DIRECTIONS:
        count = 1  # Start with the current stone
        
        # Count in positive direction
        nx, ny = x + dx, y + dy
        while is_in_bounds(nx, ny) and board[ny][nx] == player:
            count += 1
            nx += dx
            ny += dy
        
        # Count in negative direction
        nx, ny = x - dx, y - dy
        while is_in_bounds(nx, ny) and board[ny][nx] == player:
            count += 1
            nx -= dx
            ny -= dy
        
        if count >= 5:
            return True
    
    return False
```

### 2. Capture Mechanics

Captures follow the pattern: `X-O-O-X` (your stone, two opponent stones, your stone)

```python
def apply_move_with_captures(
    board: Board,
    x: int,
    y: int,
    player: int,
    captures: Dict[int, int],
) -> List[Tuple[int, int, int]]:
    """
    Place a move and apply captures.
    Returns history for undo.
    """
    # Place the stone
    board[y][x] = player
    history = [(x, y, EMPTY)]  # Remember this change
    
    opponent = get_opponent(player)
    
    # Check all 8 directions (4 lines × 2 directions each)
    for dx, dy in DIRECTIONS:
        for sign in (1, -1):
            sdx, sdy = dx * sign, dy * sign
            
            # Three positions away from placed stone
            x1, y1 = x + sdx, y + sdy
            x2, y2 = x + 2 * sdx, y + 2 * sdy
            x3, y3 = x + 3 * sdx, y + 3 * sdy
            
            # Check bounds
            if not all(is_in_bounds(xi, yi) 
                      for xi, yi in [(x1, y1), (x2, y2), (x3, y3)]):
                continue
            
            # Check capture pattern: X-O-O-X
            if (board[y1][x1] == opponent and 
                board[y2][x2] == opponent and 
                board[y3][x3] == player):
                
                # Record changes for undo
                history.append((x1, y1, opponent))
                history.append((x2, y2, opponent))
                
                # Remove captured stones
                board[y1][x1] = EMPTY
                board[y2][x2] = EMPTY
                
                # Update capture count
                captures[player] += 2
    
    return history

def undo_move_with_captures(
    board: Board,
    captures: Dict[int, int],
    player: int,
    history: List[Tuple[int, int, int]],
) -> None:
    """Undo a move and all its captures."""
    # Restore capture count
    removed_count = len(history) - 1  # -1 for the placed stone
    captures[player] -= removed_count
    
    # Restore all cells
    for hx, hy, old_value in reversed(history):
        board[hy][hx] = old_value
```

### 3. Double-Three Rule

A "free three" is a three-in-a-row that can become an open four with one more move.

```python
def is_free_three_in_direction(
    board: Board, player: int, x: int, y: int, dx: int, dy: int
) -> bool:
    """
    Check if this direction forms a free-three:
    Can one more stone in this direction create an open four?
    """
    # Try placing a stone in various positions nearby
    for step in range(-4, 5):
        tx, ty = x + step * dx, y + step * dy
        
        if not is_in_bounds(tx, ty) or board[ty][tx] != EMPTY:
            continue
        
        # Temporarily place a stone
        board[ty][tx] = player
        
        # Check if this creates an open four
        found = has_open_four_in_direction(board, player, x, y, dx, dy)
        
        # Remove the stone
        board[ty][tx] = EMPTY
        
        if found:
            return True
    
    return False

def is_legal_move(
    board: Board,
    x: int,
    y: int,
    player: int,
    captures: Dict[int, int],
) -> bool:
    """
    Check if a move is legal.
    Illegal if it creates 2+ free-threes without capturing.
    """
    if not is_in_bounds(x, y) or board[y][x] != EMPTY:
        return False
    
    # Try the move
    history = apply_move_with_captures(board, x, y, player, captures)
    made_capture = len(history) > 1
    
    # Count free-threes
    legal = True
    if not made_capture and count_free_threes(board, player, x, y) >= 2:
        legal = False
    
    # Undo and return
    undo_move_with_captures(board, captures, player, history)
    return legal
```

### 4. Terminal States (Win/Loss Detection)

```python
def get_terminal_score(board: Board, captures: Dict[int, int]) -> Optional[int]:
    """
    Return WIN_SCORE, LOSE_SCORE, or None if game continues.
    
    Win conditions (in order):
    1. 10+ captures
    2. Five-in-a-row that can't be broken by capture
    """
    # Check capture wins
    if captures[AI_PLAYER] >= 10:
        return WIN_SCORE
    if captures[OPPONENT_PLAYER] >= 10:
        return LOSE_SCORE
    
    # Check five-in-a-row wins
    ai_has_five = has_player_won(board, AI_PLAYER)
    opp_has_five = has_player_won(board, OPPONENT_PLAYER)
    
    # AI wins if it has five AND opponent can't break it by capture
    if ai_has_five and not can_break_opponent_five_by_capture(board, AI_PLAYER, captures):
        return WIN_SCORE
    
    # Opponent wins if it has five AND AI can't break it by capture
    if opp_has_five and not can_break_opponent_five_by_capture(board, OPPONENT_PLAYER, captures):
        return LOSE_SCORE
    
    return None  # Game continues
```

---

## Move Optimization Techniques

### 1. Candidate Move Generation

Instead of checking all 361 cells (19×19), only check cells near existing stones:

```python
def get_candidate_moves(board: Board) -> List[Move]:
    """
    Generate empty cells within NEIGHBOR_RADIUS of any stone.
    Much faster than checking all 361 cells.
    """
    # Find all stones
    stones = []
    for y in range(BOARD_SIZE):
        for x in range(BOARD_SIZE):
            if board[y][x] != EMPTY:
                stones.append((x, y))
    
    # First move: center of board
    if not stones:
        return [(BOARD_SIZE // 2, BOARD_SIZE // 2)]
    
    # Generate candidates near existing stones
    candidates = set()
    for sx, sy in stones:
        for dy in range(-NEIGHBOR_RADIUS, NEIGHBOR_RADIUS + 1):
            for dx in range(-NEIGHBOR_RADIUS, NEIGHBOR_RADIUS + 1):
                nx, ny = sx + dx, sy + dy
                if is_in_bounds(nx, ny) and board[ny][nx] == EMPTY:
                    candidates.add((nx, ny))
    
    return list(candidates)
```

**Impact:** Reduces search space from ~361 to ~20-50 moves typically.

### 2. Move Ordering

Better moves first = more alpha-beta pruning:

```python
def move_order_score(
    board: Board, captures: Dict[int, int], player: int, move: Move
) -> float:
    """
    Quick scoring to order moves.
    Higher score = more promising = check first.
    """
    x, y = move
    score = 0.0
    
    # 1. Prefer center (slightly)
    center = BOARD_SIZE // 2
    distance = abs(x - center) + abs(y - center)
    score -= distance * 2
    
    # 2. Try the move temporarily
    history = apply_move_with_captures(board, x, y, player, captures)
    
    # 3. Immediate win? Top priority!
    terminal = get_terminal_score(board, captures)
    if player == AI_PLAYER and terminal and terminal > 0:
        score += 1_000_000
    
    # 4. Capture move? High priority
    if len(history) > 1:  # Made captures
        score += 20_000
    
    # 5. Add heuristic evaluation
    raw = evaluate_board(board, captures)
    score += raw if player == AI_PLAYER else -raw
    
    # 4. Undo
    undo_move_with_captures(board, captures, player, history)
    
    return score

def order_moves(
    board: Board, captures: Dict[int, int], player: int, moves: list[Move]
) -> list[Move]:
    """Sort moves by descending score."""
    return sorted(
        moves,
        key=lambda m: move_order_score(board, captures, player, m),
        reverse=True
    )
```

### 3. Transposition Table

Remember positions we've already evaluated:

```python
# Create a hashable key from current position
key = (
    board_key(board),           # Board state as tuple
    captures[AI_PLAYER],        # AI captures
    captures[OPPONENT_PLAYER],  # Opponent captures
    current_player,             # Who's turn
    depth                       # Remaining depth
)

# Check if we've seen this before
if key in table:
    return table[key]

# ... do minimax search ...

# Save result for future lookups
table[key] = best_score
```

**Impact:** Dramatically reduces repeated calculations, especially in symmetric positions.

### 4. Quick Win/Block Detection

Before starting expensive minimax, check for immediate wins or blocks:

```python
# Check for immediate AI win
for x, y in legal_moves:
    history = apply_move_with_captures(board, x, y, AI_PLAYER, captures)
    terminal = get_terminal_score(board, captures)
    undo_move_with_captures(board, captures, AI_PLAYER, history)
    
    if terminal == WIN_SCORE:
        return SearchResult((x, y), WIN_SCORE, 1, stats)

# Check for dangerous opponent moves (must block)
opponent_legal_moves = get_legal_moves(board, OPPONENT_PLAYER, captures)
dangerous = set()

for x, y in opponent_legal_moves:
    history = apply_move_with_captures(board, x, y, OPPONENT_PLAYER, captures)
    terminal = get_terminal_score(board, captures)
    undo_move_with_captures(board, captures, OPPONENT_PLAYER, history)
    
    if terminal == LOSE_SCORE:
        dangerous.add((x, y))

# If we can block, do it immediately
for move in legal_moves:
    if move in dangerous:
        return SearchResult(move, 0.0, 1, stats)
```

---

## Putting It All Together

Here's the flow when the AI needs to choose a move:

```
1. choose_best_move_with_stats() is called
   ├─ Get legal moves for AI
   ├─ Check for immediate wins → return if found
   ├─ Check for opponent threats → block if found
   │
   ├─ Start iterative deepening loop (depth 1, 2, 3...)
   │  │
   │  └─ For each legal move:
   │     ├─ Apply move (with captures)
   │     ├─ Call minimax() to evaluate
   │     │  ├─ Check transposition table
   │     │  ├─ Check terminal state
   │     │  ├─ If max depth: evaluate_board()
   │     │  ├─ Otherwise: recurse for all moves
   │     │  │  ├─ Order moves (best first)
   │     │  │  ├─ Apply move
   │     │  │  ├─ Recurse (flip max/min)
   │     │  │  ├─ Undo move
   │     │  │  └─ Alpha-beta prune if possible
   │     │  └─ Save to transposition table
   │     ├─ Undo move
   │     └─ Track best move
   │
   └─ Return best move found
```

### Entry Point

```python
def choose_best_move_with_stats(
    board: Board,
    max_depth: int = DEFAULT_MAX_DEPTH,
    ai_captures: int = 0,
    opponent_captures: int = 0,
    time_limit_ms: int = DEFAULT_TIME_LIMIT_MS,
) -> SearchResult:
    """
    Choose the best move for the AI player.
    Returns the move, its score, depth reached, and statistics.
    """
    start_time = perf_counter()
    
    # Initialize captures
    captures = {
        AI_PLAYER: ai_captures,
        OPPONENT_PLAYER: opponent_captures,
    }
    
    # Get legal moves
    legal_moves = get_legal_moves(board, AI_PLAYER, captures)
    stats = SearchStats()
    
    if not legal_moves:
        stats.elapsed_ms = (perf_counter() - start_time) * 1000.0
        return SearchResult(None, 0.0, 0, stats)
    
    # [Quick win/block checks...]
    
    # Order moves (best first for pruning)
    legal_moves = order_moves(board, captures, AI_PLAYER, legal_moves)
    
    best_move = None
    best_score = float("-inf")
    depth_reached = 0
    
    # Iterative deepening
    for depth in range(1, max_depth + 1):
        elapsed_ms = (perf_counter() - start_time) * 1000.0
        if elapsed_ms >= time_limit_ms:
            break
        
        current_best_move = None
        current_best_score = float("-inf")
        table = {}  # Fresh transposition table for this depth
        
        for x, y in legal_moves:
            elapsed_ms = (perf_counter() - start_time) * 1000.0
            if elapsed_ms >= time_limit_ms:
                break
            
            # Apply move
            history = apply_move_with_captures(board, x, y, AI_PLAYER, captures)
            
            # Search from opponent's perspective
            score = minimax(
                board=board,
                captures=captures,
                depth=depth - 1,
                alpha=float("-inf"),
                beta=float("inf"),
                maximizing=False,  # Opponent's turn
                start_time=start_time,
                time_limit_ms=time_limit_ms,
                stats=stats,
                table=table,
            )
            
            # Undo move
            undo_move_with_captures(board, captures, AI_PLAYER, history)
            
            # Track best
            if score > current_best_score:
                current_best_score = score
                current_best_move = (x, y)
        
        # Save this depth's results
        if current_best_move is not None:
            best_move = current_best_move
            best_score = current_best_score
            depth_reached = depth
    
    stats.elapsed_ms = (perf_counter() - start_time) * 1000.0
    return SearchResult(best_move, best_score, depth_reached, stats)
```

---

## Performance Considerations

### Time Complexity

Without optimizations:
- Branching factor (b): ~30-50 moves per position
- Depth (d): varies (typically 3-8)
- **Nodes explored**: O(b^d) = ~50^6 = trillions!

With optimizations:
- **Candidate generation**: ~30 moves instead of 361
- **Move ordering**: Best moves first → more pruning
- **Alpha-beta pruning**: Reduces b^d to ~b^(d/2) in best case
- **Transposition table**: Avoids recalculating same positions
- **Iterative deepening**: Guarantees time limit compliance

**Result**: Practical depth of 4-8 in under 500ms

### Memory

- **Board**: 19×19×4 bytes = ~1.5 KB
- **Transposition table**: Varies (typically a few MB)
- **Call stack**: Depth × frame size (modest for depth ~8)

**Total**: Comfortably runs on any modern system

### Key Performance Metrics

```python
@dataclass
class SearchStats:
    nodes: int = 0              # Total positions evaluated
    cutoffs: int = 0            # Alpha-beta prunings
    max_depth_reached: int = 0  # Deepest search level
    elapsed_ms: float = 0.0     # Time taken
```

Good performance indicators:
- **High cutoff ratio** (cutoffs/nodes > 0.3): Good move ordering
- **Depth reached** (6-8): Deep enough for tactical play
- **Nodes per second** (>10,000): Efficient implementation

---

## Summary

This Gomoku AI combines several classic game AI techniques:

1. **Minimax Algorithm**: Explores future moves recursively
2. **Alpha-Beta Pruning**: Skips irrelevant branches (3-10x speedup)
3. **Heuristic Evaluation**: Scores non-terminal positions
4. **Move Ordering**: Improves pruning efficiency
5. **Iterative Deepening**: Handles time constraints gracefully
6. **Transposition Tables**: Caches evaluated positions
7. **Undo-Friendly Design**: Makes search efficient and clean

**Strengths:**
- Strong tactical play (sees 4-8 moves ahead)
- Respects all game rules (captures, double-three)
- Fast response time (<500ms)
- Clean, maintainable code

**Potential Improvements:**
- Opening book (pre-computed good openings)
- Pattern library (recognize common formations)
- Threat-space search (focus on forcing sequences)
- Neural network evaluation (instead of hand-crafted heuristics)

---

## Further Reading

- **Minimax & Alpha-Beta**: "Artificial Intelligence: A Modern Approach" (Russell & Norvig)
- **Game Tree Search**: Knuth & Moore's analysis of alpha-beta
- **Gomoku Strategy**: Online resources on pro-level Gomoku/Renju play
- **Advanced Topics**: Monte Carlo Tree Search (MCTS), reinforcement learning

---

*This lesson covers the complete implementation of a competitive Gomoku AI. Understanding these concepts will help you build AIs for other two-player perfect information games like Chess, Checkers, or Othello.*

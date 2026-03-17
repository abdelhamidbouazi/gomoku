use socketioxide::extract::SocketRef;

use crate::{
    events::room::board::{BoardCell, BoardCellEvent},
    game::{
        session::GameSession,
        state::{GameMove, Player},
    },
    shared::types::Board,
};

#[derive(Clone, Debug)]
pub struct Capture {
    pub seq: Vec<(usize, usize)>,
    // player who was captured
    pub player_id: Player,
    pub num_captures: usize,
}

impl Capture {
    pub fn new(player_id: Player) -> Self {
        Capture {
            seq: Vec::new(),
            player_id,
            num_captures: 0,
        }
    }

    pub async fn emit(&self, _s: &SocketRef, _game_session: &GameSession) {
        for (x, y) in &self.seq {
            _game_session
                .room
                .notify_room::<BoardCellEvent>(
                    _s,
                    Some(BoardCell {
                        x: *x,
                        y: *y,
                        player_id: None,
                    }),
                )
                .await;
        }
    }

    pub fn find_captures(
        _board: &Board,
        _game_move: &GameMove,
    ) -> Option<Self> {
        let mut captures = Capture::new(_game_move.player_id.opponent());

        // Check all 8 directions
        for x in -1..=1 {
            for y in -1..=1 {
                // Skip the origin
                if x == 0 && y == 0 {
                    continue;
                }

                let mut captured_positions = Vec::new();

                // Look for pattern: [opponent, opponent, player]
                for i in 1..=3 {
                    let nx = _game_move.x as isize + i * x;
                    let ny = _game_move.y as isize + i * y;

                    // Check bounds
                    if nx < 0
                        || ny < 0
                        || nx >= _board.len() as isize
                        || ny >= _board.len() as isize
                    {
                        break;
                    }

                    let cell = &_board[ny as usize][nx as usize];

                    if i == 1 || i == 2 {
                        // Positions 1 and 2 must be opponent pieces
                        if cell.is_some()
                            && cell.unwrap() == _game_move.player_id.opponent()
                        {
                            captured_positions.push((nx as usize, ny as usize));
                        } else {
                            break;
                        }
                    } else if i == 3 {
                        // Position 3 must be player's own piece
                        if cell.is_some()
                            && cell.unwrap() == _game_move.player_id
                        {
                            captures.seq.extend(&captured_positions);
                            captures.num_captures += 1;
                            captured_positions = Vec::new();
                        }
                    }
                }
            }
        }

        if captures.seq.is_empty() {
            None
        } else {
            Some(captures)
        }
    }
}

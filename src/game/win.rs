use std::collections::{HashMap, HashSet};

use tracing::info;

use crate::game::{
    capture::Capture,
    state::{GameMove, Player},
};

#[derive(Clone, Debug)]
pub struct Win {
    pub player_id: Player,
    pub win_seq: Option<Vec<(usize, usize)>>,
    pub is_by_five: bool,
    pub is_flanked: bool,
}

pub trait GameWin {}

impl Win {
    const CAPTURES_TO_WIN: usize = 5;
    const STONES_TO_WIN: usize = 5;

    pub fn check_for_win(
        game_move: &GameMove,
        game_captures: &Option<Capture>,
        _board: &Vec<Vec<Option<Player>>>,
        history_captures: &HashMap<Player, (usize, HashSet<usize>)>,
    ) -> Option<Win> {
        info!("Checking for win:");

        let current_player = game_move.player_id;
        info!("Current player: {:?}", current_player);

        // Check win by captures
        if let Some(win) = game_captures.as_ref().and_then(|cap| {
            info!("Capture found: {:?}", cap);
            Self::check_win_by_captures(current_player, cap, history_captures)
        }) {
            return Some(win);
        }

        if let Some(win) = Self::check_win_by_five_in_a_row(game_move, _board) {
            return Some(win);
        }

        None
    }

    fn check_win_by_five_in_a_row(
        game_move: &GameMove,
        board: &Vec<Vec<Option<Player>>>,
    ) -> Option<Win> {
        info!("Checking for five in a row win condition");
        info!("Current player: {:?}", game_move.player_id);

        let mut temp_win: Option<Win> = None;

        for (dx, dy) in [(1, 0), (0, 1), (1, 1), (1, -1)] {
            if let Some(win) =
                Self::check_direction_for_win(board, game_move, dx, dy)
            {
                // If not flanked, return immediately
                if !win.is_flanked {
                    info!("Non-flanked win found, returning immediately");
                    return Some(win);
                }

                // Store flanked win and continue checking other directions
                if temp_win.is_none() {
                    info!(
                        "Storing flanked win temporarily, checking other directions"
                    );
                    temp_win = Some(win);
                }
            }
        }

        // Return temporary win if found (even if flanked)
        temp_win
    }

    fn check_flanked(
        _board: &Vec<Vec<Option<Player>>>,
        _x: usize,
        _y: usize,
        _dx: isize,
        _dy: isize,
        _current_player: Player,
    ) -> bool {
        false
    }

    fn is_position_in_bounds(
        board: &Vec<Vec<Option<Player>>>,
        x: isize,
        y: isize,
    ) -> bool {
        x >= 0 && y >= 0 && x < board.len() as isize && y < board.len() as isize
    }

    fn count_stones_in_direction(
        board: &Vec<Vec<Option<Player>>>,
        start_x: usize,
        start_y: usize,
        dx: isize,
        dy: isize,
        direction_multiplier: isize,
        current_player: Player,
        win_seq: &mut Vec<(usize, usize)>,
    ) -> (usize, bool) {
        info!("Counting stones in direction: {}", direction_multiplier);
        let mut stones = 0;
        let mut is_flanked = false;
        let mut j = 1;

        loop {
            info!("Checking position offset by {} * ({}, {})", j, dx, dy);
            let nx = start_x as isize + direction_multiplier * j * dx;
            let ny = start_y as isize + direction_multiplier * j * dy;

            if !Self::is_position_in_bounds(board, nx, ny) {
                info!("Out of bounds at ({}, {}), stopping count", nx, ny);
                break;
            }

            let cell_value = board[ny as usize][nx as usize];
            info!(
                "Cell at board[{}][{}] (row={}, col={}): {:?}",
                ny, nx, ny, nx, cell_value
            );

            match cell_value {
                Some(player) if player == current_player => {
                    info!(
                        "Found stone for player {:?} at ({}, {})",
                        current_player, nx, ny
                    );
                    stones += 1;
                    win_seq.push((nx as usize, ny as usize));
                }
                Some(_) => {
                    info!(
                        "Found opponent's stone at ({}, {}), checking for flanking",
                        nx, ny
                    );
                    is_flanked = Self::check_flanked(
                        board,
                        nx as usize,
                        ny as usize,
                        dx,
                        dy,
                        current_player,
                    );
                    break;
                }
                None => break,
            }
            j += 1;
        }

        (stones, is_flanked)
    }

    fn check_direction_for_win(
        board: &Vec<Vec<Option<Player>>>,
        game_move: &GameMove,
        dx: isize,
        dy: isize,
    ) -> Option<Win> {
        let current_player = game_move.player_id;
        let mut stones = 1;
        let mut win_seq = vec![(game_move.x, game_move.y)];
        let mut is_flanked = false;

        info!(
            "Checking direction dx: {}, dy: {} for five in a row",
            dx, dy
        );

        // Count stones in both directions
        for direction in [-1, 1] {
            let (count, flanked) = Self::count_stones_in_direction(
                board,
                game_move.x,
                game_move.y,
                dx,
                dy,
                direction,
                current_player,
                &mut win_seq,
            );
            stones += count;
            is_flanked = is_flanked || flanked;
        }

        info!("Total stones in a row: {}", stones);

        if stones >= Self::STONES_TO_WIN {
            info!(
                "Player {:?} has five in a row! (flanked: {})",
                current_player, is_flanked
            );
            return Some(Win {
                is_by_five: true,
                player_id: game_move.player_id,
                win_seq: Some(win_seq),
                is_flanked,
            });
        }

        None
    }

    fn check_win_by_captures(
        player: Player,
        current_capture: &Capture,
        history_captures: &HashMap<Player, (usize, HashSet<usize>)>,
    ) -> Option<Win> {
        let previous_captures = history_captures
            .get(&player)
            .map(|(count, _)| *count)
            .unwrap_or(0);

        let total_captures = previous_captures + current_capture.num_captures;

        info!(
            "Current player {:?} has {} captures",
            player, previous_captures
        );

        if total_captures >= Self::CAPTURES_TO_WIN {
            info!("Player {:?} wins by captures!", player);
            return Some(Win {
                player_id: player,
                win_seq: None,
                is_by_five: false,
                is_flanked: false,
            });
        }

        None
    }
}

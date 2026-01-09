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
}

pub trait GameWin {}

impl Win {
    const CAPTURES_TO_WIN: usize = 5;

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

        // TODO: check win by five in a row

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
            });
        }

        None
    }
}

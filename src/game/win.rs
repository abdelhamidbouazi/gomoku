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
    pub fn check_for_win(
        _game_move: &GameMove,
        _game_captures: &Option<Capture>,
        _board: &Vec<Vec<Option<Player>>>,
        _history_captures: &HashMap<Player, (usize, HashSet<usize>)>,
    ) -> Option<Win> {
        {
            info!("Checking for win:");
            // check for 5 captures
            let current_player = _game_move.player_id;
            info!("Current player: {:?}", current_player);
            // check if there is a capture of opponent
            if let Some(capture) = &_game_captures {
                info!("Capture found: {:?}", capture);
                // count number of captures
                let captures = _history_captures
                    .get(&current_player)
                    .map(|(count, _)| *count)
                    .unwrap_or(0);
                info!(
                    "Current player {:?} has {} captures",
                    current_player, captures
                );
                // counting captures including the current one
                if captures + capture.num_captures >= 5 {
                    info!("Player {:?} wins by captures!", current_player);
                    return Some(Win {
                        player_id: current_player,
                        win_seq: None,
                        is_by_five: false,
                    });
                }
            }
        }
        None
    }
}

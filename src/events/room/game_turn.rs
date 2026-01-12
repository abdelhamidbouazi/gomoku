use serde_json::json;
use socketioxide::extract::SocketRef;
use tracing::info;

use crate::{events::room::event::RoomEvent, game::state::types::GameTurn};

pub struct GameTurnEvent {}

impl RoomEvent for GameTurnEvent {
    const EVENT_NAME: &'static str = "game-turn";

    type Payload = GameTurn;

    async fn notify_room(
        room_name: String,
        _s: &SocketRef,
        _payload: Option<Self::Payload>,
    ) {
        info!("Notifying room {} of game turn event", room_name);
        if let Some(payload) = _payload {
            info!(
                "Emitting game turn event for player {:?} with {} forbidden sequences",
                payload.current_player,
                payload.forbidden_sequences.len()
            );
            let _ = _s
                .within(room_name)
                .emit(
                    Self::EVENT_NAME,
                    &json!({
                        "currentPlayer": payload.current_player,
                        "turn": payload.turn,
                        "forbiddenSequences": payload.forbidden_sequences,
                    }),
                )
                .await;
        }
    }
}

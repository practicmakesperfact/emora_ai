"""
Emora Backend – HITL Connection Manager
Maintains a registry of WebSocket connections for counselors/admins.
When the AI detects a High/Critical crisis incident, it broadcasts a
real-time alert to every connected counselor dashboard.
"""

import json
from typing import Dict
from fastapi import WebSocket
from app.core.logging import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    """
    Module-level singleton that tracks active counselor WebSocket connections.
    Key  → counselor user_id (int)
    Value → FastAPI WebSocket instance
    """

    def __init__(self) -> None:
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, counselor_id: int, websocket: WebSocket) -> None:
        """Accept the WebSocket handshake and register the counselor."""
        await websocket.accept()
        self.active_connections[counselor_id] = websocket
        logger.info(
            "Counselor connected to HITL WebSocket",
            counselor_id=counselor_id,
            total_connected=len(self.active_connections),
        )

    def disconnect(self, counselor_id: int) -> None:
        """Remove a counselor from the registry (safe if not present)."""
        self.active_connections.pop(counselor_id, None)
        logger.info(
            "Counselor disconnected from HITL WebSocket",
            counselor_id=counselor_id,
            total_connected=len(self.active_connections),
        )

    async def broadcast_alert(self, payload: dict) -> None:
        """
        Send a JSON alert to ALL currently connected counselors.
        Any connections that have dropped are silently pruned.
        """
        if not self.active_connections:
            logger.debug("HITL broadcast skipped — no counselors connected")
            return

        message = json.dumps(payload)
        dead: list[int] = []

        for counselor_id, ws in self.active_connections.items():
            try:
                await ws.send_text(message)
                logger.debug("HITL alert sent", counselor_id=counselor_id)
            except Exception as exc:
                logger.warning(
                    "HITL send failed — marking connection as dead",
                    counselor_id=counselor_id,
                    error=str(exc),
                )
                dead.append(counselor_id)

        for counselor_id in dead:
            self.disconnect(counselor_id)

    @property
    def connected_count(self) -> int:
        """How many counselors are currently online."""
        return len(self.active_connections)


# ── Module-level singleton ──────────────────────────────────────────────────
# Import this instance wherever you need to broadcast or manage connections.
hitl_manager = ConnectionManager()

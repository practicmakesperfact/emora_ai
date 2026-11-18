"""
Emora Backend – HITL WebSocket Endpoint
Counselors and admins connect here to receive real-time crisis alerts.

Auth:   JWT passed as ?token=<access_token> query param
        (Browser WebSocket API does not support custom headers)
URL:    ws://HOST/api/v1/crisis/ws?token=<jwt>
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from app.core.hitl_manager import hitl_manager
from app.core.exceptions import AuthenticationException
from app.core.logging import get_logger
from app.database.connection import AsyncSessionLocal
from app.repositories.user import UserRepository
from app.security.jwt import verify_token

logger = get_logger(__name__)

router = APIRouter(tags=["HITL WebSocket"])

# Roles that are permitted to receive real-time crisis alerts
ALLOWED_ROLES = {"Counselor", "Admin"}


@router.websocket("/crisis/ws")
async def counselor_ws_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token for authentication"),
) -> None:
    """
    WebSocket endpoint for the counselor HITL dashboard.

    Protocol:
      1. Client connects with ?token=<jwt>
      2. Server verifies the token and checks role (Counselor or Admin only)
      3. On success: connection is kept alive; server pushes JSON alerts
      4. On auth failure: connection is closed with code 1008 (Policy Violation)

    Alert payload schema:
      {
        "type": "new_incident",
        "incident_id": int,
        "user_id": int,
        "risk_level": "High" | "Critical",
        "message_preview": str,          // first 120 chars
        "conversation_id": int | null,
        "created_at": str                // ISO-8601
      }

    The client may send any text to keep the connection warm (e.g. a ping);
    the server ignores those messages.
    """
    # ── Authentication ───────────────────────────────────────────────────────
    try:
        payload = verify_token(token)
        user_id = int(payload.get("sub", 0))

        async with AsyncSessionLocal() as db:
            repo = UserRepository(db)
            user = await repo.get_by_id(user_id)

        if not user or not user.role or user.role.name not in ALLOWED_ROLES:
            logger.warning(
                "HITL WS rejected — insufficient role",
                user_id=user_id,
                role=user.role.name if (user and user.role) else "none",
            )
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    except AuthenticationException:
        logger.warning("HITL WS rejected — invalid token")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    except Exception as exc:
        logger.error("HITL WS auth error", error=str(exc))
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        return

    # ── Register & keep-alive loop ───────────────────────────────────────────
    await hitl_manager.connect(user_id, websocket)
    try:
        while True:
            # Keep the connection alive by awaiting any client message.
            # The frontend may send "ping" frames; we simply discard them.
            await websocket.receive_text()
    except WebSocketDisconnect:
        hitl_manager.disconnect(user_id)
    except Exception as exc:
        logger.error("HITL WS unexpected error", user_id=user_id, error=str(exc))
        hitl_manager.disconnect(user_id)

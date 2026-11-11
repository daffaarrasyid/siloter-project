import asyncio
import logging
from typing import Any, Dict, Optional, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("siloter.websocket")

router = APIRouter()


class ConnectionManager:
    """
    Manages active WebSocket connections for real-time alert broadcasts.
    Supports asynchronous broadcasts and thread-safe dispatch from background worker threads.
    """

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def set_event_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        """Stores reference to running asyncio event loop for thread-safe cross-thread dispatches."""
        self._loop = loop

    async def connect(self, websocket: WebSocket) -> None:
        """Accepts and registers incoming client WebSocket connection."""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Active connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket) -> None:
        """Removes disconnected client from connection pool."""
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Active connections: {len(self.active_connections)}")

    async def broadcast_alert(self, payload: Dict[str, Any]) -> None:
        """
        Broadcasts an alert payload to all connected Next.js dashboard clients.
        Automatically cleans up stale or disconnected clients.
        """
        if not self.active_connections:
            logger.debug("No active WebSocket clients connected. Broadcast skipped.")
            return

        dead_connections = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(payload)
            except Exception as e:
                logger.warning(f"Failed to transmit alert to WebSocket client: {e}")
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)

        logger.info(
            f"Alert broadcast successfully dispatched to {len(self.active_connections)} client(s)."
        )

    def broadcast_sync(self, payload: Dict[str, Any]) -> None:
        """
        Thread-safe broadcast helper called from synchronous OpenCV worker threads.
        Schedules broadcast_alert onto the active asyncio event loop without blocking.
        """
        if not self.active_connections:
            logger.debug("No active WebSocket connections. Skipping sync broadcast.")
            return

        if self._loop is not None and self._loop.is_running():
            asyncio.run_coroutine_threadsafe(self.broadcast_alert(payload), self._loop)
        else:
            try:
                loop = asyncio.get_running_loop()
                loop.create_task(self.broadcast_alert(payload))
            except RuntimeError:
                # No running event loop in this thread; broadcast is non-blocking
                pass


# Global connection manager instance
connection_manager = ConnectionManager()


@router.websocket("/ws/alerts")
async def websocket_alerts_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time traffic loitering alert notifications.
    Frontend Next.js Command Center subscribes here to receive instant violation popups.
    """
    await connection_manager.connect(websocket)
    # Ensure active event loop is cached
    connection_manager.set_event_loop(asyncio.get_running_loop())

    try:
        while True:
            # Keep socket alive and respond to client heartbeat ping
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
    except Exception as e:
        logger.debug(f"WebSocket client connection closed: {e}")
        connection_manager.disconnect(websocket)

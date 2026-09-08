"""Notification delivery behind a provider interface.

FCM push and SMS gateway are NOT provisioned. Only the WebSocket + in-app provider
is active now; the interface is the contract so a vendor can be plugged in later
without touching SOS/geofence call sites.
"""
from typing import Protocol

from fastapi import WebSocket

import db as dbmod


class NotificationProvider(Protocol):
    async def notify_caregivers(self, patient_id: str, event: dict) -> None: ...


class ConnectionManager:
    def __init__(self):
        # caregiver_id -> set[WebSocket]
        self._sockets: dict[str, set[WebSocket]] = {}

    async def connect(self, caregiver_id: str, ws: WebSocket):
        await ws.accept()
        self._sockets.setdefault(caregiver_id, set()).add(ws)

    def disconnect(self, caregiver_id: str, ws: WebSocket):
        conns = self._sockets.get(caregiver_id)
        if conns:
            conns.discard(ws)
            if not conns:
                self._sockets.pop(caregiver_id, None)

    async def send_to(self, caregiver_id: str, event: dict):
        for ws in list(self._sockets.get(caregiver_id, set())):
            try:
                await ws.send_json(event)
            except Exception:
                self.disconnect(caregiver_id, ws)


manager = ConnectionManager()


class WebSocketProvider:
    """Active provider: delivers to any linked caregiver with an open dashboard socket."""

    async def notify_caregivers(self, patient_id: str, event: dict) -> None:
        db = dbmod.get_db()
        links = db.caregiver_links.find({"patient_id": patient_id})
        async for link in links:
            await manager.send_to(link["caregiver_id"], event)


# Single active provider instance (swap here to add FCM/SMS later).
provider: NotificationProvider = WebSocketProvider()

"""WebSocket handler for real-time meeting communication."""
import json
import asyncio
from datetime import datetime
from typing import Dict, Set
from fastapi import WebSocket, WebSocketDisconnect, APIRouter
from app.ai.demo_provider import DemoAIProvider, DEMO_TRANSCRIPT

router = APIRouter()

# In-memory connection store: {meeting_id: {user_id: websocket}}
active_connections: Dict[str, Dict[str, WebSocket]] = {}


class MeetingConnectionManager:
    def __init__(self):
        self.connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, meeting_id: str, user_id: str, websocket: WebSocket):
        await websocket.accept()
        if meeting_id not in self.connections:
            self.connections[meeting_id] = {}
        self.connections[meeting_id][user_id] = websocket
        await self.broadcast(meeting_id, {
            "event": "participant:joined",
            "data": {"user_id": user_id, "count": len(self.connections[meeting_id])},
        }, exclude=user_id)

    def disconnect(self, meeting_id: str, user_id: str):
        if meeting_id in self.connections:
            self.connections[meeting_id].pop(user_id, None)
            if not self.connections[meeting_id]:
                del self.connections[meeting_id]

    async def send_personal(self, websocket: WebSocket, message: dict):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception:
            pass

    async def broadcast(self, meeting_id: str, message: dict, exclude: str = None):
        if meeting_id not in self.connections:
            return
        dead = []
        for user_id, ws in self.connections[meeting_id].items():
            if user_id == exclude:
                continue
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.append(user_id)
        for uid in dead:
            self.connections[meeting_id].pop(uid, None)

    def get_participant_count(self, meeting_id: str) -> int:
        return len(self.connections.get(meeting_id, {}))


manager = MeetingConnectionManager()


@router.websocket("/ws/meeting/{meeting_id}/{user_id}")
async def meeting_websocket(websocket: WebSocket, meeting_id: str, user_id: str):
    await manager.connect(meeting_id, user_id, websocket)
    try:
        # Send welcome message
        await manager.send_personal(websocket, {
            "event": "meeting:status",
            "data": {
                "meeting_id": meeting_id,
                "participant_count": manager.get_participant_count(meeting_id),
                "timestamp": datetime.utcnow().isoformat(),
            },
        })

        while True:
            raw = await websocket.receive_text()
            message = json.loads(raw)
            event = message.get("event")
            data = message.get("data", {})

            if event == "transcript:update":
                # Broadcast transcript segment to all participants
                await manager.broadcast(meeting_id, {
                    "event": "transcript:update",
                    "data": {
                        "speaker_id": data.get("speaker_id"),
                        "speaker_name": data.get("speaker_name"),
                        "text": data.get("text"),
                        "translations": data.get("translations", {}),
                        "timestamp": datetime.utcnow().isoformat(),
                        "offset": data.get("offset", 0),
                        "confidence": data.get("confidence", 1.0),
                    },
                })

            elif event == "speaker:update":
                await manager.broadcast(meeting_id, {
                    "event": "speaker:update",
                    "data": data,
                })

            elif event == "meeting:join":
                await manager.broadcast(meeting_id, {
                    "event": "notification:update",
                    "data": {
                        "message": f"{data.get('name', 'A participant')} joined the meeting",
                        "type": "info",
                    },
                })

            elif event == "meeting:leave":
                await manager.broadcast(meeting_id, {
                    "event": "participant:left",
                    "data": {"user_id": user_id, "count": manager.get_participant_count(meeting_id)},
                })

            elif event == "ping":
                await manager.send_personal(websocket, {"event": "pong", "data": {}})

            elif event == "demo:start_stream":
                # Stream demo transcript segments for demo mode
                asyncio.create_task(_stream_demo_transcript(meeting_id, user_id, websocket))

    except WebSocketDisconnect:
        manager.disconnect(meeting_id, user_id)
        await manager.broadcast(meeting_id, {
            "event": "participant:left",
            "data": {"user_id": user_id, "count": manager.get_participant_count(meeting_id)},
        })
    except Exception:
        manager.disconnect(meeting_id, user_id)


async def _stream_demo_transcript(meeting_id: str, user_id: str, websocket: WebSocket):
    """Stream demo transcript segments with realistic timing."""
    demo = DemoAIProvider()
    segments = demo.get_demo_transcript()

    for segment in segments:
        await asyncio.sleep(3)  # Simulate speech timing
        message = {
            "event": "transcript:update",
            "data": {
                "speaker_id": segment["speaker_id"],
                "speaker_name": segment["speaker_name"],
                "text": segment["original_text"],
                "translations": segment["translations"],
                "timestamp": datetime.utcnow().isoformat(),
                "offset": segment["offset_seconds"],
                "confidence": segment["confidence"],
                "is_demo": True,
            },
        }
        try:
            await websocket.send_text(json.dumps(message))
            # Also broadcast to meeting room
            await manager.broadcast(meeting_id, message, exclude=user_id)
        except Exception:
            break

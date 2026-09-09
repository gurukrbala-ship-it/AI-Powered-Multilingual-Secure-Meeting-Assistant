"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


# ─── Enums ───────────────────────────────────────────────────────────────────

class UserRoleEnum(str, Enum):
    admin = "admin"
    host = "host"
    participant = "participant"


class MeetingTypeEnum(str, Enum):
    business = "business"
    education = "education"
    healthcare = "healthcare"
    government = "government"
    conference = "conference"
    team_meeting = "team_meeting"
    other = "other"


class MeetingStatusEnum(str, Enum):
    scheduled = "scheduled"
    active = "active"
    ended = "ended"
    cancelled = "cancelled"


class ActionPriorityEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class ActionStatusEnum(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


# ─── Auth Schemas ─────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRoleEnum = UserRoleEnum.participant
    preferred_language: str = "en"

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    preferred_language: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    preferred_language: Optional[str] = None


# ─── Meeting Schemas ──────────────────────────────────────────────────────────

class MeetingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    meeting_type: MeetingTypeEnum = MeetingTypeEnum.business
    scheduled_time: Optional[datetime] = None
    expected_duration_minutes: int = 60
    speech_language: str = "en"
    participant_languages: List[str] = ["en"]
    is_confidential: bool = False
    meeting_pin: Optional[str] = None
    require_approval: bool = False
    encrypted_storage: bool = False
    session_timeout_minutes: Optional[int] = None


class MeetingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    status: Optional[MeetingStatusEnum] = None


class MeetingResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    meeting_type: str
    host_id: str
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    scheduled_time: Optional[datetime]
    expected_duration_minutes: int
    status: str
    is_confidential: bool
    speech_language: str
    participant_languages: List[str]
    room_code: str
    require_approval: bool
    is_demo: bool
    created_at: datetime
    host: Optional[UserResponse] = None
    participant_count: Optional[int] = 0
    duration_minutes: Optional[float] = None

    class Config:
        from_attributes = True


# ─── Participant Schemas ──────────────────────────────────────────────────────

class ParticipantAdd(BaseModel):
    user_id: str
    role: str = "participant"
    preferred_language: str = "en"


class ParticipantResponse(BaseModel):
    id: str
    meeting_id: str
    user_id: str
    role: str
    preferred_language: str
    joined_at: Optional[datetime]
    left_at: Optional[datetime]
    speaker_label: Optional[str]
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ─── Transcript Schemas ───────────────────────────────────────────────────────

class TranscriptSegmentCreate(BaseModel):
    speaker_id: Optional[str] = None
    speaker_name: Optional[str] = None
    original_text: str
    source_language: str = "en"
    confidence: float = 1.0
    offset_seconds: float = 0.0
    translations: Dict[str, str] = {}


class TranscriptSegmentResponse(BaseModel):
    id: str
    meeting_id: str
    speaker_id: Optional[str]
    speaker_name: Optional[str]
    timestamp: datetime
    offset_seconds: float
    original_text: str
    source_language: str
    confidence: float
    translations: Dict[str, str]

    class Config:
        from_attributes = True


# ─── Summary Schemas ──────────────────────────────────────────────────────────

class SummaryResponse(BaseModel):
    id: str
    meeting_id: str
    executive_summary: Optional[str]
    key_points: List[str]
    topics_discussed: List[Dict[str, Any]]
    sentiment: Optional[str]
    tone_breakdown: Dict[str, Any]
    meeting_effectiveness: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Decision Schemas ─────────────────────────────────────────────────────────

class DecisionResponse(BaseModel):
    id: str
    meeting_id: str
    decision: str
    decided_by: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


# ─── Action Item Schemas ──────────────────────────────────────────────────────

class ActionItemResponse(BaseModel):
    id: str
    meeting_id: str
    task: str
    assigned_to_id: Optional[str]
    assigned_to_name: Optional[str]
    deadline: Optional[str]
    priority: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ActionItemUpdate(BaseModel):
    status: Optional[ActionStatusEnum] = None
    priority: Optional[ActionPriorityEnum] = None
    deadline: Optional[str] = None


# ─── AI Q&A Schemas ───────────────────────────────────────────────────────────

class AskQuestionRequest(BaseModel):
    question: str


class AskQuestionResponse(BaseModel):
    question: str
    answer: str
    sources: List[Dict[str, Any]] = []
    is_demo: bool = False
    confidence: Optional[float] = None


# ─── Search Schemas ───────────────────────────────────────────────────────────

class SearchResult(BaseModel):
    meeting_id: str
    meeting_title: str
    result_type: str  # transcript, summary, decision, action
    content: str
    speaker: Optional[str]
    timestamp: Optional[datetime]
    offset_seconds: Optional[float]


# ─── Audit Log Schemas ────────────────────────────────────────────────────────

class AuditLogResponse(BaseModel):
    id: str
    user_id: Optional[str]
    meeting_id: Optional[str]
    action: str
    details: Dict[str, Any]
    ip_address: Optional[str]
    timestamp: datetime
    user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ─── Insights Schemas ─────────────────────────────────────────────────────────

class InsightsResponse(BaseModel):
    total_meetings: int
    meetings_this_week: int
    hours_transcribed: float
    languages_used: List[str]
    pending_action_items: int
    confidential_meetings: int
    recent_meetings: List[MeetingResponse]


# ─── WebSocket Schemas ────────────────────────────────────────────────────────

class WSMessage(BaseModel):
    event: str
    data: Dict[str, Any] = {}
    meeting_id: Optional[str] = None
    user_id: Optional[str] = None


TokenResponse.model_rebuild()

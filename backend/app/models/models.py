"""Database models for LinguaMeet AI."""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Text,
    ForeignKey, Enum as SAEnum, Float, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.database.database import Base


def generate_uuid():
    return str(uuid.uuid4())


# ─── Enums ───────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    admin = "admin"
    host = "host"
    participant = "participant"


class MeetingType(str, enum.Enum):
    business = "business"
    education = "education"
    healthcare = "healthcare"
    government = "government"
    conference = "conference"
    team_meeting = "team_meeting"
    other = "other"


class MeetingStatus(str, enum.Enum):
    scheduled = "scheduled"
    active = "active"
    ended = "ended"
    cancelled = "cancelled"


class ParticipantRole(str, enum.Enum):
    host = "host"
    co_host = "co_host"
    participant = "participant"
    viewer = "viewer"


class ActionPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class ActionStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


# ─── Models ──────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.participant, nullable=False)
    preferred_language = Column(String(10), default="en")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    hosted_meetings = relationship("Meeting", back_populates="host", foreign_keys="Meeting.host_id")
    participations = relationship("MeetingParticipant", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    action_items = relationship("ActionItem", back_populates="assignee", foreign_keys="ActionItem.assigned_to_id")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    meeting_type = Column(SAEnum(MeetingType), default=MeetingType.business, nullable=False)
    host_id = Column(String, ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    scheduled_time = Column(DateTime, nullable=True)
    expected_duration_minutes = Column(Integer, default=60)
    status = Column(SAEnum(MeetingStatus), default=MeetingStatus.scheduled, nullable=False)
    is_confidential = Column(Boolean, default=False)
    meeting_pin = Column(String(10), nullable=True)
    speech_language = Column(String(10), default="en")
    participant_languages = Column(JSON, default=list)
    room_code = Column(String(20), unique=True, nullable=False)
    require_approval = Column(Boolean, default=False)
    encrypted_storage = Column(Boolean, default=False)
    session_timeout_minutes = Column(Integer, nullable=True)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    host = relationship("User", back_populates="hosted_meetings", foreign_keys=[host_id])
    participants = relationship("MeetingParticipant", back_populates="meeting")
    transcript_segments = relationship("TranscriptSegment", back_populates="meeting", order_by="TranscriptSegment.timestamp")
    summary = relationship("MeetingSummary", back_populates="meeting", uselist=False)
    decisions = relationship("Decision", back_populates="meeting")
    action_items = relationship("ActionItem", back_populates="meeting")
    audit_logs = relationship("AuditLog", back_populates="meeting")
    documents = relationship("MeetingDocument", back_populates="meeting")


class MeetingParticipant(Base):
    __tablename__ = "participants"

    id = Column(String, primary_key=True, default=generate_uuid)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    role = Column(SAEnum(ParticipantRole), default=ParticipantRole.participant)
    preferred_language = Column(String(10), default="en")
    joined_at = Column(DateTime, nullable=True)
    left_at = Column(DateTime, nullable=True)
    is_approved = Column(Boolean, default=True)
    speaker_label = Column(String(50), nullable=True)

    # Relationships
    meeting = relationship("Meeting", back_populates="participants")
    user = relationship("User", back_populates="participations")


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id = Column(String, primary_key=True, default=generate_uuid)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    speaker_id = Column(String, nullable=True)
    speaker_name = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    offset_seconds = Column(Float, default=0.0)
    original_text = Column(Text, nullable=False)
    source_language = Column(String(10), default="en")
    confidence = Column(Float, default=1.0)
    translations = Column(JSON, default=dict)  # {lang_code: translated_text}

    # Relationships
    meeting = relationship("Meeting", back_populates="transcript_segments")


class MeetingSummary(Base):
    __tablename__ = "summaries"

    id = Column(String, primary_key=True, default=generate_uuid)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False, unique=True)
    executive_summary = Column(Text, nullable=True)
    key_points = Column(JSON, default=list)
    topics_discussed = Column(JSON, default=list)
    sentiment = Column(String(50), nullable=True)
    tone_breakdown = Column(JSON, default=dict)
    meeting_effectiveness = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    meeting = relationship("Meeting", back_populates="summary")


class Decision(Base):
    __tablename__ = "decisions"

    id = Column(String, primary_key=True, default=generate_uuid)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    decision = Column(Text, nullable=False)
    decided_by = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    offset_seconds = Column(Float, nullable=True)

    # Relationships
    meeting = relationship("Meeting", back_populates="decisions")


class ActionItem(Base):
    __tablename__ = "action_items"

    id = Column(String, primary_key=True, default=generate_uuid)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    task = Column(Text, nullable=False)
    assigned_to_id = Column(String, ForeignKey("users.id"), nullable=True)
    assigned_to_name = Column(String(255), nullable=True)
    deadline = Column(String(100), nullable=True)
    priority = Column(SAEnum(ActionPriority), default=ActionPriority.medium)
    status = Column(SAEnum(ActionStatus), default=ActionStatus.pending)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    meeting = relationship("Meeting", back_populates="action_items")
    assignee = relationship("User", back_populates="action_items", foreign_keys=[assigned_to_id])


class MeetingDocument(Base):
    __tablename__ = "meeting_documents"

    id = Column(String, primary_key=True, default=generate_uuid)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    document_name = Column(String(500), nullable=False)
    storage_path = Column(String(1000), nullable=False)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    meeting = relationship("Meeting", back_populates="documents")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=True)
    action = Column(String(255), nullable=False)
    details = Column(JSON, default=dict)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="audit_logs")
    meeting = relationship("Meeting", back_populates="audit_logs")


class MeetingEmbedding(Base):
    """Stores RAG embeddings for meeting Q&A."""
    __tablename__ = "meeting_embeddings"

    id = Column(String, primary_key=True, default=generate_uuid)
    meeting_id = Column(String, ForeignKey("meetings.id"), nullable=False)
    chunk_text = Column(Text, nullable=False)
    chunk_type = Column(String(50), nullable=True)  # transcript, summary, decision, action
    embedding = Column(JSON, nullable=True)  # stored as list of floats
    chunk_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

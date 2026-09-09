"""Meetings router."""
import random
import string
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session, joinedload

from app.database.database import get_db
from app.models.models import Meeting, MeetingParticipant, User, AuditLog, ParticipantRole, MeetingStatus
from app.schemas.schemas import (
    MeetingCreate, MeetingUpdate, MeetingResponse,
    ParticipantAdd, ParticipantResponse, UserResponse
)
from app.auth.auth import get_current_user
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/meetings", tags=["Meetings"])


def generate_room_code(length=8):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))


def _meeting_to_response(meeting: Meeting, db: Session) -> MeetingResponse:
    duration = None
    if meeting.start_time and meeting.end_time:
        duration = (meeting.end_time - meeting.start_time).total_seconds() / 60

    return MeetingResponse(
        id=meeting.id,
        title=meeting.title,
        description=meeting.description,
        meeting_type=meeting.meeting_type,
        host_id=meeting.host_id,
        start_time=meeting.start_time,
        end_time=meeting.end_time,
        scheduled_time=meeting.scheduled_time,
        expected_duration_minutes=meeting.expected_duration_minutes,
        status=meeting.status,
        is_confidential=meeting.is_confidential,
        speech_language=meeting.speech_language,
        participant_languages=meeting.participant_languages or [],
        room_code=meeting.room_code,
        require_approval=meeting.require_approval,
        is_demo=meeting.is_demo,
        created_at=meeting.created_at,
        host=UserResponse.model_validate(meeting.host) if meeting.host else None,
        participant_count=len(meeting.participants),
        duration_minutes=duration,
    )


@router.get("", response_model=List[MeetingResponse])
def list_meetings(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List meetings for the current user."""
    query = db.query(Meeting).options(
        joinedload(Meeting.host),
        joinedload(Meeting.participants)
    )

    if current_user.role != "admin":
        # Show meetings where user is host or participant
        from sqlalchemy import or_
        participant_meeting_ids = db.query(MeetingParticipant.meeting_id).filter(
            MeetingParticipant.user_id == current_user.id
        ).subquery()
        query = query.filter(
            or_(
                Meeting.host_id == current_user.id,
                Meeting.id.in_(participant_meeting_ids)
            )
        )

    if status:
        query = query.filter(Meeting.status == status)

    if search:
        query = query.filter(Meeting.title.ilike(f"%{search}%"))

    meetings = query.order_by(Meeting.created_at.desc()).limit(100).all()
    return [_meeting_to_response(m, db) for m in meetings]


@router.post("", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
def create_meeting(
    payload: MeetingCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new meeting."""
    # Generate unique room code
    while True:
        code = generate_room_code()
        if not db.query(Meeting).filter(Meeting.room_code == code).first():
            break

    meeting = Meeting(
        title=payload.title,
        description=payload.description,
        meeting_type=payload.meeting_type,
        host_id=current_user.id,
        scheduled_time=payload.scheduled_time,
        expected_duration_minutes=payload.expected_duration_minutes,
        speech_language=payload.speech_language,
        participant_languages=payload.participant_languages,
        is_confidential=payload.is_confidential,
        meeting_pin=payload.meeting_pin,
        require_approval=payload.require_approval,
        encrypted_storage=payload.encrypted_storage,
        session_timeout_minutes=payload.session_timeout_minutes,
        room_code=code,
        status=MeetingStatus.scheduled,
    )
    db.add(meeting)
    db.flush()

    # Add host as participant
    host_participant = MeetingParticipant(
        meeting_id=meeting.id,
        user_id=current_user.id,
        role=ParticipantRole.host,
        preferred_language=current_user.preferred_language,
        is_approved=True,
    )
    db.add(host_participant)
    db.commit()
    db.refresh(meeting)

    log_action(db, current_user.id, meeting.id, "meeting_created",
               {"title": meeting.title}, request.client.host if request.client else None)

    return _meeting_to_response(meeting, db)


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get meeting by ID."""
    meeting = db.query(Meeting).options(
        joinedload(Meeting.host),
        joinedload(Meeting.participants)
    ).filter(Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Access control
    if not _can_access_meeting(current_user, meeting, db):
        raise HTTPException(status_code=403, detail="Access denied")

    return _meeting_to_response(meeting, db)


@router.put("/{meeting_id}", response_model=MeetingResponse)
def update_meeting(
    meeting_id: str,
    payload: MeetingUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update meeting details."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if meeting.host_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the host can update this meeting")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(meeting, field, value)

    db.commit()
    db.refresh(meeting)

    log_action(db, current_user.id, meeting.id, "meeting_updated",
               {"fields": list(update_data.keys())}, request.client.host if request.client else None)

    return _meeting_to_response(meeting, db)


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a meeting (host or admin only)."""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if meeting.host_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the host can delete this meeting")

    log_action(db, current_user.id, meeting.id, "meeting_deleted",
               {"title": meeting.title}, request.client.host if request.client else None)

    db.delete(meeting)
    db.commit()


@router.post("/{meeting_id}/start", response_model=MeetingResponse)
def start_meeting(
    meeting_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Start a meeting (host only)."""
    meeting = db.query(Meeting).options(
        joinedload(Meeting.host), joinedload(Meeting.participants)
    ).filter(Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.host_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the host can start the meeting")
    if meeting.status == MeetingStatus.active:
        raise HTTPException(status_code=400, detail="Meeting is already active")

    meeting.status = MeetingStatus.active
    meeting.start_time = datetime.utcnow()
    db.commit()
    db.refresh(meeting)

    log_action(db, current_user.id, meeting.id, "meeting_started",
               {}, request.client.host if request.client else None)

    return _meeting_to_response(meeting, db)


@router.post("/{meeting_id}/end", response_model=MeetingResponse)
def end_meeting(
    meeting_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """End a meeting (host only)."""
    meeting = db.query(Meeting).options(
        joinedload(Meeting.host), joinedload(Meeting.participants)
    ).filter(Meeting.id == meeting_id).first()

    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if meeting.host_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the host can end the meeting")

    meeting.status = MeetingStatus.ended
    meeting.end_time = datetime.utcnow()
    db.commit()
    db.refresh(meeting)

    log_action(db, current_user.id, meeting.id, "meeting_ended",
               {}, request.client.host if request.client else None)

    return _meeting_to_response(meeting, db)


# ─── Participants ─────────────────────────────────────────────────────────────

@router.post("/{meeting_id}/participants", response_model=ParticipantResponse, status_code=201)
def add_participant(
    meeting_id: str,
    payload: ParticipantAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    existing = db.query(MeetingParticipant).filter(
        MeetingParticipant.meeting_id == meeting_id,
        MeetingParticipant.user_id == payload.user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a participant")

    target_user = db.query(User).filter(User.id == payload.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    participant = MeetingParticipant(
        meeting_id=meeting_id,
        user_id=payload.user_id,
        role=payload.role,
        preferred_language=payload.preferred_language,
        is_approved=not meeting.require_approval,
    )
    db.add(participant)
    db.commit()
    db.refresh(participant)

    return ParticipantResponse.model_validate(participant)


@router.get("/{meeting_id}/participants", response_model=List[ParticipantResponse])
def get_participants(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if not _can_access_meeting(current_user, meeting, db):
        raise HTTPException(status_code=403, detail="Access denied")

    participants = db.query(MeetingParticipant).options(
        joinedload(MeetingParticipant.user)
    ).filter(MeetingParticipant.meeting_id == meeting_id).all()

    return [ParticipantResponse.model_validate(p) for p in participants]


@router.delete("/{meeting_id}/participants/{user_id}", status_code=204)
def remove_participant(
    meeting_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if meeting.host_id != current_user.id and current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")

    participant = db.query(MeetingParticipant).filter(
        MeetingParticipant.meeting_id == meeting_id,
        MeetingParticipant.user_id == user_id,
    ).first()

    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")

    db.delete(participant)
    db.commit()


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _can_access_meeting(user: User, meeting: Meeting, db: Session) -> bool:
    """Check if user can access a meeting."""
    if user.role == "admin":
        return True
    if meeting.host_id == user.id:
        return True
    participant = db.query(MeetingParticipant).filter(
        MeetingParticipant.meeting_id == meeting.id,
        MeetingParticipant.user_id == user.id,
        MeetingParticipant.is_approved == True,
    ).first()
    return participant is not None

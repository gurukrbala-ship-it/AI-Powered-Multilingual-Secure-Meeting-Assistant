"""Transcript, Summary, and Action Items router."""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.models import (
    Meeting, TranscriptSegment, MeetingSummary, Decision, ActionItem, User, MeetingParticipant
)
from app.schemas.schemas import (
    TranscriptSegmentCreate, TranscriptSegmentResponse,
    SummaryResponse, DecisionResponse, ActionItemResponse, ActionItemUpdate,
    AskQuestionRequest, AskQuestionResponse
)
from app.auth.auth import get_current_user
from app.ai.demo_provider import DemoAIProvider
from app.ai.ai_orchestrator import AIOrchestrator
from app.config import get_settings
from app.services.audit_service import log_action

router = APIRouter(prefix="/api/meetings", tags=["Transcript & AI"])
settings = get_settings()


def get_ai_provider():
    if settings.is_demo_mode:
        return DemoAIProvider()
    return AIOrchestrator()


def _check_meeting_access(meeting_id: str, user: User, db: Session) -> Meeting:
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if user.role == "admin" or meeting.host_id == user.id:
        return meeting

    participant = db.query(MeetingParticipant).filter(
        MeetingParticipant.meeting_id == meeting_id,
        MeetingParticipant.user_id == user.id,
        MeetingParticipant.is_approved == True,
    ).first()
    if not participant:
        raise HTTPException(status_code=403, detail="Access denied")
    return meeting


# ─── Transcript ───────────────────────────────────────────────────────────────

@router.get("/{meeting_id}/transcript", response_model=List[TranscriptSegmentResponse])
def get_transcript(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = _check_meeting_access(meeting_id, current_user, db)

    segments = db.query(TranscriptSegment).filter(
        TranscriptSegment.meeting_id == meeting_id
    ).order_by(TranscriptSegment.offset_seconds).all()

    return [TranscriptSegmentResponse.model_validate(s) for s in segments]


@router.post("/{meeting_id}/transcript", response_model=TranscriptSegmentResponse, status_code=201)
def add_transcript_segment(
    meeting_id: str,
    payload: TranscriptSegmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a transcript segment (used by the meeting WebSocket handler)."""
    meeting = _check_meeting_access(meeting_id, current_user, db)

    segment = TranscriptSegment(
        meeting_id=meeting_id,
        speaker_id=payload.speaker_id,
        speaker_name=payload.speaker_name,
        original_text=payload.original_text,
        source_language=payload.source_language,
        confidence=payload.confidence,
        offset_seconds=payload.offset_seconds,
        translations=payload.translations,
    )
    db.add(segment)
    db.commit()
    db.refresh(segment)
    return TranscriptSegmentResponse.model_validate(segment)


# ─── Summary ──────────────────────────────────────────────────────────────────

@router.get("/{meeting_id}/summary", response_model=SummaryResponse)
def get_summary(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_meeting_access(meeting_id, current_user, db)
    summary = db.query(MeetingSummary).filter(MeetingSummary.meeting_id == meeting_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not yet generated")
    return SummaryResponse.model_validate(summary)


@router.post("/{meeting_id}/generate-summary", response_model=SummaryResponse)
def generate_summary(
    meeting_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trigger AI meeting summary generation."""
    meeting = _check_meeting_access(meeting_id, current_user, db)

    if meeting.host_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the host can generate the summary")

    segments = db.query(TranscriptSegment).filter(
        TranscriptSegment.meeting_id == meeting_id
    ).order_by(TranscriptSegment.offset_seconds).all()

    transcript_text = "\n".join(
        f"{s.speaker_name or s.speaker_id or 'Speaker'}: {s.original_text}"
        for s in segments
    )

    ai = get_ai_provider()
    result = ai.generate_summary(transcript_text, meeting)

    # Upsert summary
    existing = db.query(MeetingSummary).filter(MeetingSummary.meeting_id == meeting_id).first()
    if existing:
        existing.executive_summary = result.get("executive_summary", "")
        existing.key_points = result.get("key_points", [])
        existing.topics_discussed = result.get("topics_discussed", [])
        existing.sentiment = result.get("sentiment", "neutral")
        existing.tone_breakdown = result.get("tone_breakdown", {})
        existing.meeting_effectiveness = result.get("meeting_effectiveness", {})
        summary = existing
    else:
        summary = MeetingSummary(
            meeting_id=meeting_id,
            executive_summary=result.get("executive_summary", ""),
            key_points=result.get("key_points", []),
            topics_discussed=result.get("topics_discussed", []),
            sentiment=result.get("sentiment", "neutral"),
            tone_breakdown=result.get("tone_breakdown", {}),
            meeting_effectiveness=result.get("meeting_effectiveness", {}),
        )
        db.add(summary)

    # Save decisions
    db.query(Decision).filter(Decision.meeting_id == meeting_id).delete()
    for d in result.get("decisions", []):
        db.add(Decision(meeting_id=meeting_id, decision=d["text"], decided_by=d.get("decided_by")))

    # Save action items
    db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).delete()
    for item in result.get("action_items", []):
        db.add(ActionItem(
            meeting_id=meeting_id,
            task=item["task"],
            assigned_to_name=item.get("assigned_to"),
            deadline=item.get("deadline"),
            priority=item.get("priority", "medium"),
            status="pending",
        ))

    db.commit()
    db.refresh(summary)

    log_action(db, current_user.id, meeting_id, "summary_generated",
               {"is_demo": settings.is_demo_mode}, request.client.host if request.client else None)

    return SummaryResponse.model_validate(summary)


# ─── Decisions ────────────────────────────────────────────────────────────────

@router.get("/{meeting_id}/decisions", response_model=List[DecisionResponse])
def get_decisions(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_meeting_access(meeting_id, current_user, db)
    decisions = db.query(Decision).filter(Decision.meeting_id == meeting_id).all()
    return [DecisionResponse.model_validate(d) for d in decisions]


# ─── Action Items ─────────────────────────────────────────────────────────────

@router.get("/{meeting_id}/actions", response_model=List[ActionItemResponse])
def get_action_items(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _check_meeting_access(meeting_id, current_user, db)
    items = db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).all()
    return [ActionItemResponse.model_validate(i) for i in items]


@router.put("/action-items/{item_id}", response_model=ActionItemResponse)
def update_action_item(
    item_id: str,
    payload: ActionItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    item = db.query(ActionItem).filter(ActionItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Action item not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)
    return ActionItemResponse.model_validate(item)


# ─── AI Q&A ───────────────────────────────────────────────────────────────────

@router.post("/{meeting_id}/ask", response_model=AskQuestionResponse)
def ask_about_meeting(
    meeting_id: str,
    payload: AskQuestionRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ask AI a question about a specific meeting."""
    meeting = _check_meeting_access(meeting_id, current_user, db)

    # Gather meeting knowledge
    segments = db.query(TranscriptSegment).filter(
        TranscriptSegment.meeting_id == meeting_id
    ).order_by(TranscriptSegment.offset_seconds).all()

    summary = db.query(MeetingSummary).filter(MeetingSummary.meeting_id == meeting_id).first()
    decisions = db.query(Decision).filter(Decision.meeting_id == meeting_id).all()
    actions = db.query(ActionItem).filter(ActionItem.meeting_id == meeting_id).all()

    context = {
        "transcript": [
            {
                "speaker": s.speaker_name or s.speaker_id or "Speaker",
                "text": s.original_text,
                "offset": s.offset_seconds,
            }
            for s in segments
        ],
        "summary": summary.executive_summary if summary else None,
        "key_points": summary.key_points if summary else [],
        "decisions": [d.decision for d in decisions],
        "action_items": [
            {"task": a.task, "assigned_to": a.assigned_to_name, "deadline": a.deadline}
            for a in actions
        ],
    }

    ai = get_ai_provider()
    result = ai.answer_question(payload.question, context, meeting)

    log_action(db, current_user.id, meeting_id, "ai_question_asked",
               {"question": payload.question[:200]}, request.client.host if request.client else None)

    return AskQuestionResponse(
        question=payload.question,
        answer=result["answer"],
        sources=result.get("sources", []),
        is_demo=settings.is_demo_mode,
        confidence=result.get("confidence"),
    )


# ─── Audit Logs ───────────────────────────────────────────────────────────────

@router.get("/{meeting_id}/audit-logs")
def get_audit_logs(
    meeting_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    if meeting.host_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only host or admin can view audit logs")

    from app.models.models import AuditLog
    from sqlalchemy.orm import joinedload
    logs = db.query(AuditLog).options(
        joinedload(AuditLog.user)
    ).filter(AuditLog.meeting_id == meeting_id).order_by(AuditLog.timestamp.desc()).all()

    return [
        {
            "id": l.id,
            "user": l.user.name if l.user else "System",
            "action": l.action,
            "details": l.details,
            "ip_address": l.ip_address,
            "timestamp": l.timestamp.isoformat(),
        }
        for l in logs
    ]

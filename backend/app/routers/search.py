"""Search and dashboard analytics router."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from datetime import datetime, timedelta

from app.database.database import get_db
from app.models.models import (
    Meeting, TranscriptSegment, MeetingSummary, Decision, ActionItem,
    User, MeetingParticipant
)
from app.auth.auth import get_current_user
from app.schemas.schemas import SearchResult, InsightsResponse

router = APIRouter(prefix="/api", tags=["Search & Insights"])


@router.get("/search", response_model=List[SearchResult])
def search_meetings(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Global search across meetings, transcripts, decisions, and action items."""
    results = []

    # Accessible meeting IDs
    participant_ids = db.query(MeetingParticipant.meeting_id).filter(
        MeetingParticipant.user_id == current_user.id
    ).subquery()

    if current_user.role == "admin":
        accessible = db.query(Meeting.id).subquery()
    else:
        accessible = db.query(Meeting.id).filter(
            or_(Meeting.host_id == current_user.id, Meeting.id.in_(participant_ids))
        ).subquery()

    meetings_map = {
        m.id: m.title
        for m in db.query(Meeting).filter(Meeting.id.in_(accessible)).all()
    }

    # Search transcripts
    segments = db.query(TranscriptSegment).filter(
        TranscriptSegment.meeting_id.in_(accessible),
        TranscriptSegment.original_text.ilike(f"%{q}%"),
    ).limit(20).all()

    for s in segments:
        results.append(SearchResult(
            meeting_id=s.meeting_id,
            meeting_title=meetings_map.get(s.meeting_id, "Unknown Meeting"),
            result_type="transcript",
            content=s.original_text,
            speaker=s.speaker_name or s.speaker_id,
            timestamp=s.timestamp,
            offset_seconds=s.offset_seconds,
        ))

    # Search decisions
    decisions = db.query(Decision).filter(
        Decision.meeting_id.in_(accessible),
        Decision.decision.ilike(f"%{q}%"),
    ).limit(10).all()

    for d in decisions:
        results.append(SearchResult(
            meeting_id=d.meeting_id,
            meeting_title=meetings_map.get(d.meeting_id, "Unknown Meeting"),
            result_type="decision",
            content=d.decision,
            speaker=d.decided_by,
            timestamp=d.timestamp,
            offset_seconds=None,
        ))

    # Search action items
    actions = db.query(ActionItem).filter(
        ActionItem.meeting_id.in_(accessible),
        ActionItem.task.ilike(f"%{q}%"),
    ).limit(10).all()

    for a in actions:
        results.append(SearchResult(
            meeting_id=a.meeting_id,
            meeting_title=meetings_map.get(a.meeting_id, "Unknown Meeting"),
            result_type="action_item",
            content=f"{a.task} — Assigned to: {a.assigned_to_name or 'Not specified'}",
            speaker=a.assigned_to_name,
            timestamp=a.created_at,
            offset_seconds=None,
        ))

    # Search meeting titles
    title_matches = db.query(Meeting).filter(
        Meeting.id.in_(accessible),
        Meeting.title.ilike(f"%{q}%"),
    ).limit(5).all()

    for m in title_matches:
        if m.id not in {r.meeting_id for r in results if r.result_type == "meeting"}:
            results.append(SearchResult(
                meeting_id=m.id,
                meeting_title=m.title,
                result_type="meeting",
                content=m.description or m.title,
                speaker=None,
                timestamp=m.created_at,
                offset_seconds=None,
            ))

    return results[:50]


@router.get("/insights/dashboard", response_model=InsightsResponse)
def get_dashboard_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get dashboard statistics and recent meetings."""
    week_ago = datetime.utcnow() - timedelta(days=7)

    if current_user.role == "admin":
        base_query = db.query(Meeting)
    else:
        participant_ids = db.query(MeetingParticipant.meeting_id).filter(
            MeetingParticipant.user_id == current_user.id
        ).subquery()
        base_query = db.query(Meeting).filter(
            or_(Meeting.host_id == current_user.id, Meeting.id.in_(participant_ids))
        )

    all_meetings = base_query.all()
    meetings_this_week = [m for m in all_meetings if m.created_at and m.created_at >= week_ago]
    confidential = [m for m in all_meetings if m.is_confidential]

    # Hours transcribed
    total_segments = db.query(TranscriptSegment).filter(
        TranscriptSegment.meeting_id.in_([m.id for m in all_meetings])
    ).all()
    max_offsets = {}
    for s in total_segments:
        if s.meeting_id not in max_offsets or s.offset_seconds > max_offsets[s.meeting_id]:
            max_offsets[s.meeting_id] = s.offset_seconds
    hours_transcribed = sum(max_offsets.values()) / 3600

    # Languages
    languages = set()
    for m in all_meetings:
        if m.speech_language:
            languages.add(m.speech_language)
        for lang in (m.participant_languages or []):
            languages.add(lang)

    # Pending action items
    meeting_ids = [m.id for m in all_meetings]
    pending_actions = db.query(ActionItem).filter(
        ActionItem.meeting_id.in_(meeting_ids),
        ActionItem.status == "pending",
    ).count() if meeting_ids else 0

    # Recent meetings
    recent = sorted(all_meetings, key=lambda m: m.created_at or datetime.min, reverse=True)[:10]

    from app.routers.meetings import _meeting_to_response
    recent_responses = [_meeting_to_response(m, db) for m in recent]

    return InsightsResponse(
        total_meetings=len(all_meetings),
        meetings_this_week=len(meetings_this_week),
        hours_transcribed=round(hours_transcribed, 1),
        languages_used=list(languages),
        pending_action_items=pending_actions,
        confidential_meetings=len(confidential),
        recent_meetings=recent_responses,
    )


@router.get("/action-items/my", )
def get_my_action_items(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all action items assigned to the current user."""
    items = db.query(ActionItem).filter(
        ActionItem.assigned_to_id == current_user.id
    ).order_by(ActionItem.created_at.desc()).all()

    from app.schemas.schemas import ActionItemResponse
    return [ActionItemResponse.model_validate(i) for i in items]

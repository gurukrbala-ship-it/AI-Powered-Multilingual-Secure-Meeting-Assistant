"""Audit service helper."""
from sqlalchemy.orm import Session
from app.models.models import AuditLog


def log_action(
    db: Session,
    user_id: str,
    meeting_id: str,
    action: str,
    details: dict,
    ip_address: str = None,
):
    """Create an audit log entry."""
    log = AuditLog(
        user_id=user_id,
        meeting_id=meeting_id,
        action=action,
        details=details or {},
        ip_address=ip_address,
    )
    db.add(log)
    db.commit()

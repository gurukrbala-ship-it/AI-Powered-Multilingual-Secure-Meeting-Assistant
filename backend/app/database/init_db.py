"""Database initialization and seed script."""
from app.database.database import engine, Base
from app.models.models import (
    User, Meeting, MeetingParticipant, TranscriptSegment,
    MeetingSummary, Decision, ActionItem, AuditLog, MeetingEmbedding
)
from app.auth.auth import hash_password
from app.ai.demo_provider import DEMO_TRANSCRIPT, DEMO_SUMMARY
import uuid
from datetime import datetime


def init_db():
    """Create all tables."""
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables created")


def seed_demo_data():
    """Seed the database with demo meeting data."""
    from app.database.database import SessionLocal
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.email == "arun@linguameet.demo").first():
            print("[OK] Demo data already seeded")
            return

        print("[*] Seeding demo data...")

        # Create demo users
        arun = User(
            id=str(uuid.uuid4()),
            name="Arun Kumar",
            email="arun@linguameet.demo",
            password_hash=hash_password("Demo@1234"),
            role="host",
            preferred_language="en",
        )
        priya = User(
            id=str(uuid.uuid4()),
            name="Priya Sharma",
            email="priya@linguameet.demo",
            password_hash=hash_password("Demo@1234"),
            role="participant",
            preferred_language="ta",
        )
        rahul = User(
            id=str(uuid.uuid4()),
            name="Rahul Singh",
            email="rahul@linguameet.demo",
            password_hash=hash_password("Demo@1234"),
            role="participant",
            preferred_language="hi",
        )
        admin_user = User(
            id=str(uuid.uuid4()),
            name="Admin User",
            email="admin@linguameet.demo",
            password_hash=hash_password("Admin@1234"),
            role="admin",
            preferred_language="en",
        )

        db.add_all([arun, priya, rahul, admin_user])
        db.flush()

        # Create demo meeting
        meeting_id = str(uuid.uuid4())
        import random, string
        room_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

        meeting = Meeting(
            id=meeting_id,
            title="Project Phoenix Development Review",
            description="Weekly development review for Project Phoenix. Discussing backend completion, testing timelines, and deployment.",
            meeting_type="business",
            host_id=arun.id,
            start_time=datetime(2024, 1, 15, 10, 0, 0),
            end_time=datetime(2024, 1, 15, 10, 42, 0),
            scheduled_time=datetime(2024, 1, 15, 10, 0, 0),
            expected_duration_minutes=60,
            status="ended",
            is_confidential=False,
            speech_language="en",
            participant_languages=["en", "ta", "hi"],
            room_code=room_code,
            is_demo=True,
        )
        db.add(meeting)

        # Add participants
        for user, lang, role in [(arun, "en", "host"), (priya, "ta", "participant"), (rahul, "hi", "participant")]:
            p = MeetingParticipant(
                meeting_id=meeting_id,
                user_id=user.id,
                role=role,
                preferred_language=lang,
                joined_at=datetime(2024, 1, 15, 10, 0, 0),
                left_at=datetime(2024, 1, 15, 10, 42, 0),
                is_approved=True,
                speaker_label=f"Speaker {['1','2','3'][list([arun,priya,rahul]).index(user)]}",
            )
            db.add(p)

        # Add transcript segments
        speaker_map = {"speaker_1": arun.id, "speaker_2": priya.id, "speaker_3": rahul.id}
        name_map = {"speaker_1": "Arun Kumar", "speaker_2": "Priya Sharma", "speaker_3": "Rahul Singh"}
        base_time = datetime(2024, 1, 15, 10, 0, 0)
        from datetime import timedelta

        for seg in DEMO_TRANSCRIPT:
            segment = TranscriptSegment(
                meeting_id=meeting_id,
                speaker_id=seg["speaker_id"],
                speaker_name=seg["speaker_name"],
                timestamp=base_time + timedelta(seconds=seg["offset_seconds"]),
                offset_seconds=seg["offset_seconds"],
                original_text=seg["original_text"],
                source_language=seg["source_language"],
                confidence=seg["confidence"],
                translations=seg["translations"],
            )
            db.add(segment)

        # Add summary
        summary = MeetingSummary(
            meeting_id=meeting_id,
            executive_summary=DEMO_SUMMARY["executive_summary"],
            key_points=DEMO_SUMMARY["key_points"],
            topics_discussed=DEMO_SUMMARY["topics_discussed"],
            sentiment=DEMO_SUMMARY["sentiment"],
            tone_breakdown=DEMO_SUMMARY["tone_breakdown"],
            meeting_effectiveness=DEMO_SUMMARY["meeting_effectiveness"],
        )
        db.add(summary)

        # Add decisions
        for d in DEMO_SUMMARY["decisions"]:
            db.add(Decision(
                meeting_id=meeting_id,
                decision=d["text"],
                decided_by=d.get("decided_by"),
                timestamp=base_time + timedelta(minutes=15),
            ))

        # Add action items
        assignee_map = {"Arun": arun.id, "Priya": priya.id, "Rahul": rahul.id}
        for item in DEMO_SUMMARY["action_items"]:
            assignee_name = item.get("assigned_to")
            db.add(ActionItem(
                meeting_id=meeting_id,
                task=item["task"],
                assigned_to_id=assignee_map.get(assignee_name),
                assigned_to_name=assignee_name,
                deadline=item.get("deadline"),
                priority=item.get("priority", "medium"),
                status="pending",
            ))

        db.commit()
        print("[OK] Demo data seeded successfully")
        print(f"   Demo users: arun@linguameet.demo / priya@linguameet.demo / rahul@linguameet.demo")
        print(f"   Admin user: admin@linguameet.demo (password: Admin@1234)")
        print(f"   All demo user passwords: Demo@1234")

    except Exception as e:
        db.rollback()
        print(f"[ERR] Error seeding demo data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    seed_demo_data()

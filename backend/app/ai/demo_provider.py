"""Demo AI Provider — simulates AI responses when IBM credentials are unavailable.
All responses are clearly labeled as demo/simulated data.
"""
from datetime import datetime
from app.models.models import Meeting


DEMO_TRANSCRIPT = [
    {
        "speaker_id": "speaker_1",
        "speaker_name": "Arun",
        "original_text": "Good morning everyone. Let's begin the Project Phoenix Development Review.",
        "offset_seconds": 0,
        "source_language": "en",
        "translations": {
            "ta": "நல்ல காலை. Project Phoenix Development Review ஐ தொடங்குவோம்.",
            "hi": "सुप्रभात सभी को। चलिए Project Phoenix Development Review शुरू करते हैं।",
            "ml": "ഗുഡ് മോർണിംഗ്. Project Phoenix Development Review ആരംഭിക്കാം.",
        },
        "confidence": 0.97,
    },
    {
        "speaker_id": "speaker_1",
        "speaker_name": "Arun",
        "original_text": "We need to complete the backend development by Friday.",
        "offset_seconds": 8,
        "source_language": "en",
        "translations": {
            "ta": "வெள்ளிக்கிழமைக்குள் backend development ஐ முடிக்க வேண்டும்.",
            "hi": "हमें शुक्रवार तक backend development पूरा करना है।",
            "ml": "ഞങ്ങൾ വെള്ളിയാഴ്ചയോടെ backend development പൂർത്തിയാക്കണം.",
        },
        "confidence": 0.96,
    },
    {
        "speaker_id": "speaker_2",
        "speaker_name": "Priya",
        "original_text": "I need two additional days for testing. The current timeline is too tight.",
        "offset_seconds": 18,
        "source_language": "en",
        "translations": {
            "ta": "எனக்கு testing க்கு இரண்டு கூடுதல் நாட்கள் தேவை. தற்போதைய timeline மிகவும் இறுக்கமாக உள்ளது.",
            "hi": "मुझे testing के लिए दो अतिरिक्त दिन चाहिए। वर्तमान timeline बहुत tight है।",
            "ml": "എനിക്ക് testing നു രണ്ട് അധിക ദിവസം വേണം. നിലവിലെ timeline വളരെ tight ആണ്.",
        },
        "confidence": 0.95,
    },
    {
        "speaker_id": "speaker_1",
        "speaker_name": "Arun",
        "original_text": "We can allocate Sunday for extra testing time. The Friday deadline remains.",
        "offset_seconds": 32,
        "source_language": "en",
        "translations": {
            "ta": "கூடுதல் testing நேரத்திற்கு ஞாயிற்றுக்கிழமை ஒதுக்கலாம். வெள்ளி deadline இருக்கும்.",
            "hi": "हम अतिरिक्त testing time के लिए रविवार दे सकते हैं। शुक्रवार की deadline बनी रहती है।",
            "ml": "അധിക testing സമയത്തിനായി ഞങ്ങൾ ഞായറാഴ്ച നൽകാം. വെള്ളി deadline നിലനിൽക്കുന്നു.",
        },
        "confidence": 0.97,
    },
    {
        "speaker_id": "speaker_3",
        "speaker_name": "Rahul",
        "original_text": "I will prepare the deployment documentation and infrastructure setup.",
        "offset_seconds": 44,
        "source_language": "en",
        "translations": {
            "ta": "நான் deployment documentation மற்றும் infrastructure setup தயார் செய்வேன்.",
            "hi": "मैं deployment documentation और infrastructure setup तैयार करूंगा।",
            "ml": "ഞാൻ deployment documentation ഉം infrastructure setup ഉം തയ്യാറാക്കും.",
        },
        "confidence": 0.98,
    },
    {
        "speaker_id": "speaker_2",
        "speaker_name": "Priya",
        "original_text": "I will also prepare the test cases and QA checklist by Thursday.",
        "offset_seconds": 55,
        "source_language": "en",
        "translations": {
            "ta": "வியாழக்கிழமைக்குள் test cases மற்றும் QA checklist தயார் செய்வேன்.",
            "hi": "मैं गुरुवार तक test cases और QA checklist भी तैयार करूंगी।",
            "ml": "ഞാൻ വ്യാഴാഴ്ചയോടെ test cases ഉം QA checklist ഉം തയ്യാറാക്കും.",
        },
        "confidence": 0.96,
    },
    {
        "speaker_id": "speaker_1",
        "speaker_name": "Arun",
        "original_text": "Great. Let's schedule the final review meeting for Monday morning.",
        "offset_seconds": 67,
        "source_language": "en",
        "translations": {
            "ta": "சரி. திங்கள் காலை final review meeting திட்டமிடுவோம்.",
            "hi": "ठीक है। सोमवार सुबह final review meeting शेड्यूल करते हैं।",
            "ml": "ശരി. തിങ്കളാഴ്ച രാവിലെ final review meeting schedule ചെയ്യാം.",
        },
        "confidence": 0.97,
    },
]

DEMO_SUMMARY = {
    "executive_summary": (
        "The Project Phoenix Development Review focused on finalizing the project timeline. "
        "Arun confirmed the backend development deadline of Friday. Priya raised concerns about "
        "testing timelines and requested additional time, which was accommodated with Sunday buffer. "
        "Rahul committed to preparing deployment documentation. The team agreed on a final review "
        "meeting for Monday morning."
    ),
    "key_points": [
        "Backend development must be completed by Friday.",
        "Testing requires additional time; Sunday buffer allocated.",
        "Priya will prepare test cases and QA checklist by Thursday.",
        "Rahul will handle deployment documentation and infrastructure setup.",
        "Final review meeting scheduled for Monday morning.",
    ],
    "topics_discussed": [
        {"topic": "Backend Development", "percentage": 35},
        {"topic": "Testing & QA", "percentage": 30},
        {"topic": "Deployment & Infrastructure", "percentage": 20},
        {"topic": "Timeline & Scheduling", "percentage": 15},
    ],
    "decisions": [
        {"text": "Backend development target completion date is Friday.", "decided_by": "Arun"},
        {"text": "Sunday buffer time allocated for additional testing.", "decided_by": "Arun"},
        {"text": "Final review meeting scheduled for Monday morning.", "decided_by": "Team"},
    ],
    "action_items": [
        {"task": "Complete backend development", "assigned_to": "Arun", "deadline": "Friday", "priority": "high"},
        {"task": "Prepare test cases and QA checklist", "assigned_to": "Priya", "deadline": "Thursday", "priority": "high"},
        {"task": "Prepare deployment documentation and infrastructure setup", "assigned_to": "Rahul", "deadline": "Not specified", "priority": "medium"},
    ],
    "sentiment": "positive",
    "tone_breakdown": {"positive": 60, "neutral": 30, "concerned": 10, "urgent": 0},
    "meeting_effectiveness": {
        "speaking_time_balance": "moderate",
        "decisions_made": 3,
        "action_items_created": 3,
        "questions_raised": 1,
        "participants_active": 3,
    },
}


DEMO_QA_ANSWERS = {
    "What was the final decision": {
        "answer": "The team decided that backend development must be completed by Friday. Additionally, Sunday buffer time was allocated for additional testing, and a final review meeting was scheduled for Monday morning.",
        "sources": [{"type": "transcript", "speaker": "Arun", "offset": 32, "text": "The Friday deadline remains."}],
    },
    "Who is responsible for testing": {
        "answer": "Priya is responsible for testing. She will prepare the test cases and QA checklist by Thursday.",
        "sources": [{"type": "transcript", "speaker": "Priya", "offset": 55, "text": "I will also prepare the test cases and QA checklist by Thursday."}],
    },
    "What deadlines were discussed": {
        "answer": "The following deadlines were discussed:\n• Backend development: Friday (assigned to Arun)\n• Test cases and QA checklist: Thursday (assigned to Priya)\n• Final review meeting: Monday morning",
        "sources": [
            {"type": "action_item", "task": "Backend development", "deadline": "Friday"},
            {"type": "action_item", "task": "Test cases and QA checklist", "deadline": "Thursday"},
        ],
    },
    "What did Rahul agree to do": {
        "answer": "Rahul agreed to prepare the deployment documentation and infrastructure setup. No specific deadline was mentioned for this task.",
        "sources": [{"type": "transcript", "speaker": "Rahul", "offset": 44, "text": "I will prepare the deployment documentation and infrastructure setup."}],
    },
    "Show all action items": {
        "answer": "Here are all action items from the meeting:\n\n1. **Complete backend development** — Assigned to: Arun — Deadline: Friday — Priority: High\n\n2. **Prepare test cases and QA checklist** — Assigned to: Priya — Deadline: Thursday — Priority: High\n\n3. **Prepare deployment documentation and infrastructure setup** — Assigned to: Rahul — Deadline: Not specified — Priority: Medium",
        "sources": [{"type": "action_items", "count": 3}],
    },
    "Summarize the meeting in three points": {
        "answer": "Here is a three-point summary:\n\n1. The backend development deadline is set for Friday, led by Arun.\n\n2. Priya will handle testing and QA by Thursday, with a Sunday buffer available if needed.\n\n3. Rahul will prepare the deployment documentation, and the team will hold a final review meeting on Monday morning.",
        "sources": [{"type": "summary"}],
    },
}


class DemoAIProvider:
    """Simulates AI responses for demo purposes. Clearly labeled as demo data."""

    def get_demo_transcript(self):
        """Return demo transcript segments."""
        return DEMO_TRANSCRIPT

    def generate_summary(self, transcript_text: str, meeting: Meeting) -> dict:
        """Return a simulated meeting summary."""
        return DEMO_SUMMARY

    def answer_question(self, question: str, context: dict, meeting: Meeting) -> dict:
        """Return a grounded answer from demo meeting data."""
        question_lower = question.lower()

        # Match against known demo questions
        for key, response in DEMO_QA_ANSWERS.items():
            if any(word in question_lower for word in key.lower().split()[:3]):
                return {
                    "answer": f"[DEMO MODE] {response['answer']}",
                    "sources": response.get("sources", []),
                    "confidence": 0.92,
                }

        # Check if transcript has relevant content
        if context.get("transcript"):
            relevant_segments = [
                s for s in context["transcript"]
                if any(word in s["text"].lower() for word in question_lower.split() if len(word) > 3)
            ]
            if relevant_segments:
                text = relevant_segments[0]["text"]
                speaker = relevant_segments[0]["speaker"]
                return {
                    "answer": f"[DEMO MODE] Based on the meeting transcript, {speaker} mentioned: \"{text}\"",
                    "sources": [{"type": "transcript", "speaker": speaker, "text": text}],
                    "confidence": 0.75,
                }

        return {
            "answer": "I couldn't find that information in this meeting.",
            "sources": [],
            "confidence": 0.0,
        }

    def translate_text(self, text: str, source_lang: str, target_lang: str) -> str:
        """Return demo translation."""
        demo_translations = {
            ("en", "ta"): {
                "We need to complete the project": "திட்டத்தை முடிக்க வேண்டும்",
                "backend": "backend",
                "testing": "சோதனை",
            }
        }
        return f"[Demo translation: {text}]"

    def transcribe_audio(self, audio_data: bytes, language: str = "en") -> dict:
        """Return demo transcription."""
        return {
            "text": "[Demo Mode] Audio transcription simulated.",
            "confidence": 0.95,
            "speaker_id": "speaker_1",
        }

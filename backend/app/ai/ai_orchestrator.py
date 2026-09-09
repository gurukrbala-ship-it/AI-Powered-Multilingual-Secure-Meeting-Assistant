"""AI Orchestrator — routes to real IBM services when credentials are available."""
import httpx
from app.config import get_settings
from app.models.models import Meeting

settings = get_settings()


class AIOrchestrator:
    """Live AI provider using IBM Watson and watsonx.ai services."""

    def __init__(self):
        self.stt_api_key = settings.IBM_STT_API_KEY
        self.stt_url = settings.IBM_STT_URL
        self.translator_api_key = settings.IBM_TRANSLATOR_API_KEY
        self.translator_url = settings.IBM_TRANSLATOR_URL
        self.watsonx_api_key = settings.WATSONX_API_KEY
        self.watsonx_project_id = settings.WATSONX_PROJECT_ID
        self.watsonx_url = settings.WATSONX_URL

    def _get_iam_token(self, api_key: str) -> str:
        """Exchange IBM API key for IAM access token."""
        resp = httpx.post(
            "https://iam.cloud.ibm.com/identity/token",
            data={"grant_type": "urn:ibm:params:oauth:grant-type:apikey", "apikey": api_key},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()["access_token"]

    def translate_text(self, text: str, source_lang: str, target_lang: str) -> str:
        """Translate text using IBM Watson Language Translator."""
        try:
            from ibm_watson import LanguageTranslatorV3
            from ibm_cloud_sdk_core.authenticators import IAMAuthenticator

            authenticator = IAMAuthenticator(self.translator_api_key)
            lt = LanguageTranslatorV3(version="2018-05-01", authenticator=authenticator)
            lt.set_service_url(self.translator_url)

            result = lt.translate(text=text, source=source_lang, target=target_lang).get_result()
            return result["translations"][0]["translation"]
        except Exception as e:
            raise RuntimeError(f"Translation service error: {str(e)}")

    def generate_summary(self, transcript_text: str, meeting: Meeting) -> dict:
        """Generate meeting summary using IBM watsonx.ai."""
        try:
            iam_token = self._get_iam_token(self.watsonx_api_key)
            model_url = f"{self.watsonx_url}/ml/v1/text/generation"

            prompt = f"""You are a professional meeting analyst. Analyze the following meeting transcript and provide a structured response in JSON format.

Meeting: {meeting.title}
Transcript:
{transcript_text}

Provide the following in valid JSON:
{{
  "executive_summary": "concise 2-3 sentence summary",
  "key_points": ["point1", "point2", ...],
  "decisions": [{{"text": "decision text", "decided_by": "person or null"}}],
  "action_items": [{{"task": "task", "assigned_to": "person or null", "deadline": "deadline or Not specified", "priority": "high/medium/low"}}],
  "sentiment": "positive/neutral/concerned",
  "topics_discussed": [{{"topic": "topic name", "percentage": number}}]
}}

IMPORTANT: Only include information explicitly stated in the transcript. Do not invent deadlines or responsibilities."""

            headers = {
                "Authorization": f"Bearer {iam_token}",
                "Content-Type": "application/json",
            }
            body = {
                "model_id": "ibm/granite-13b-instruct-v2",
                "input": prompt,
                "parameters": {"max_new_tokens": 1000, "temperature": 0.1},
                "project_id": self.watsonx_project_id,
            }
            resp = httpx.post(model_url, json=body, headers=headers, timeout=60)
            resp.raise_for_status()
            import json
            result_text = resp.json()["results"][0]["generated_text"]
            start = result_text.find("{")
            end = result_text.rfind("}") + 1
            return json.loads(result_text[start:end])
        except Exception as e:
            raise RuntimeError(f"watsonx.ai summary generation error: {str(e)}")

    def answer_question(self, question: str, context: dict, meeting: Meeting) -> dict:
        """Answer a question about a meeting using watsonx.ai RAG."""
        try:
            iam_token = self._get_iam_token(self.watsonx_api_key)
            model_url = f"{self.watsonx_url}/ml/v1/text/generation"

            transcript_text = "\n".join(
                f"{s['speaker']}: {s['text']}" for s in context.get("transcript", [])
            )
            decisions_text = "\n".join(context.get("decisions", []))
            actions_text = "\n".join(
                f"- {a['task']} (Assigned to: {a.get('assigned_to', 'Not specified')}, Deadline: {a.get('deadline', 'Not specified')})"
                for a in context.get("action_items", [])
            )

            prompt = f"""You are a helpful meeting assistant. Answer the user's question using ONLY the information provided from the meeting. If the answer is not in the meeting content, respond with "I couldn't find that information in this meeting."

Meeting: {meeting.title}

TRANSCRIPT:
{transcript_text}

DECISIONS:
{decisions_text}

ACTION ITEMS:
{actions_text}

SUMMARY:
{context.get('summary', 'Not available')}

USER QUESTION: {question}

ANSWER:"""

            headers = {
                "Authorization": f"Bearer {iam_token}",
                "Content-Type": "application/json",
            }
            body = {
                "model_id": "ibm/granite-13b-instruct-v2",
                "input": prompt,
                "parameters": {"max_new_tokens": 500, "temperature": 0.1},
                "project_id": self.watsonx_project_id,
            }
            resp = httpx.post(model_url, json=body, headers=headers, timeout=60)
            resp.raise_for_status()
            answer = resp.json()["results"][0]["generated_text"].strip()

            return {
                "answer": answer,
                "sources": [{"type": "meeting_transcript", "meeting": meeting.title}],
                "confidence": 0.9,
            }
        except Exception as e:
            raise RuntimeError(f"watsonx.ai Q&A error: {str(e)}")

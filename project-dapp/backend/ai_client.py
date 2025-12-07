import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai.errors import ClientError

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY missing")

client = genai.Client(api_key=GEMINI_API_KEY)

MODEL_NAME = "gemini-2.0-flash"  # or another enabled model for your key


def match_patient_to_trial(medical_history: str, trial_criteria: str):
    prompt = f"""
You are an AI assistant matching patients to a clinical trial.

Patient medical history:
{medical_history}

Trial eligibility criteria:
{trial_criteria}

Return ONLY JSON with:
{{
  "eligible": true or false,
  "score": integer 0-100,
  "reasons": ["short reason 1", "short reason 2"]
}}
"""

    try:
        resp = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
        )

        # If response has no text, return fallback
        if not hasattr(resp, "text") or not resp.text:
            return {
                "eligible": False,
                "score": 0,
                "reasons": [
                    "AI matching did not return any text.",
                    "This may be due to quota or model configuration.",
                ],
            }

        raw = resp.text.strip()

        # Strip Markdown code fences like ```json ... ```
        if raw.startswith("```"):
            lines = raw.splitlines()
            # drop opening fence (``````json)
            lines = lines[1:]
            # drop closing fence if present
            if lines and lines[-1].strip().startswith("```"):
                lines = lines[:-1]
            raw = "\n".join(lines).strip()

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return {
                "eligible": False,
                "score": 0,
                "reasons": [
                    "AI response was not valid JSON even after cleaning.",
                    f"Raw response (truncated): {raw[:120]}...",
                ],
            }

    except ClientError as e:
        return {
            "eligible": False,
            "score": 0,
            "reasons": [
                "AI matching is temporarily unavailable (quota or model issue).",
                f"Underlying error: {str(e)[:120]}...",
            ],
        }

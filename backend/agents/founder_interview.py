from services.groq_client import groq_chat_json
from config import QWEN_MODEL

SYSTEM_PROMPT = """You are a skeptical startup advisor conducting a founder interview.
Generate 6 critical questions to evaluate a startup idea.
Questions should probe:
- Target customer
- Current alternatives
- Willingness to pay
- Unique approach
- User acquisition
- Business model

Return JSON: {"questions": ["q1", "q2", ...]}
"""


async def generate_questions(idea: str) -> list[str]:
    result = await groq_chat_json(QWEN_MODEL, SYSTEM_PROMPT, f"Startup idea: {idea}")
    return result["questions"]

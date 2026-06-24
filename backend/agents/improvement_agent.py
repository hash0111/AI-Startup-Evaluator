from services.groq_client import groq_chat_json
from config import QWEN_MODEL
from models.schemas import ImprovementSuggestions, Improvement

SYSTEM_PROMPT = """You are a startup strategy consultant.
Suggest improvements for a startup idea.
For each suggestion provide:
- current: the current aspect
- improved: the improved version
- reason: why this improves the idea

Focus on: pivots, niche positioning, differentiation, alternative customer segments.

Return JSON: {"suggestions": [{"current": "", "improved": "", "reason": ""}]}
"""


async def suggest_improvements(idea: str, context: str) -> ImprovementSuggestions:
    result = await groq_chat_json(
        QWEN_MODEL,
        SYSTEM_PROMPT,
        f"Idea: {idea}\n\nContext:\n{context}",
    )
    return ImprovementSuggestions(**result)

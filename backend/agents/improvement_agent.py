from services.groq_client import groq_chat_json
from config import QWEN_MODEL
from models.schemas import ImprovementSuggestions, ImprovementAction

SYSTEM_PROMPT = """You are a startup strategy consultant writing an improvement roadmap.

For each improvement, provide a complete action plan. Return JSON with this structure:
{
  "suggestions": [
    {
      "current_situation": "What the startup currently does or assumes",
      "problem": "Why this is a problem",
      "recommendation": "What to do instead",
      "expected_impact": "What improvement to expect",
      "estimated_difficulty": "Easy / Medium / Hard",
      "priority": "High / Medium / Low",
      "timeline": "e.g., 2 weeks, 30 days, 60 days"
    }
  ]
}

Rules:
- Generate 3-5 improvements.
- Focus on: pivots, niche positioning, differentiation, alternative customer segments, pricing.
- Every recommendation must be specific and actionable.
- expected_impact should be measurable.
"""


async def suggest_improvements(idea: str, context: str) -> ImprovementSuggestions:
    result = await groq_chat_json(
        QWEN_MODEL,
        SYSTEM_PROMPT,
        f"Idea: {idea}\n\nContext:\n{context}",
    )
    suggestions = [ImprovementAction(**s) for s in result.get("suggestions", [])]
    return ImprovementSuggestions(suggestions=suggestions)

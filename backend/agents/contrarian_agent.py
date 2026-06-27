from services.groq_client import groq_chat_json
from services.tavily_client import search_web
from config import DEEPSEEK_MODEL
from models.schemas import StrategicChallenges, StrategicChallenge

SYSTEM_PROMPT = """You are a contrarian investor writing a strategic challenges memo.

Your job is to challenge the founder's assumptions with evidence. For each assumption identify:
- assumption: What the founder likely believes
- why_wrong: Why this may be incorrect
- evidence: Supporting data or reasoning
- alternative_approach: A better way to think about it

Return JSON with this structure:
{
  "challenges": [
    {
      "assumption": "Founder's likely assumption",
      "why_wrong": "Why it may be incorrect",
      "evidence": "Supporting reasoning or data",
      "alternative_approach": "A better framing or approach"
    }
  ]
}

Rules:
- Generate 3-5 challenges.
- Do not be negative for the sake of it — be constructively critical.
- Each challenge must help the founder make a better decision.
"""


async def generate_contrarian_report(idea: str, context: str) -> StrategicChallenges:
    query = f"{idea} failure risks challenges why it won't work"
    search_results = await search_web(query, max_results=3)

    search_text = "\n".join(
        [
            f"Title: {r.get('title','')}\nContent: {r.get('content','')[:500]}"
            for r in search_results
        ]
    )

    result = await groq_chat_json(
        DEEPSEEK_MODEL,
        SYSTEM_PROMPT,
        f"Idea: {idea}\nContext: {context}\n\nSearch results:\n{search_text}",
    )
    challenges = [StrategicChallenge(**c) for c in result.get("challenges", [])]
    return StrategicChallenges(challenges=challenges)

from services.groq_client import groq_chat_json
from services.tavily_client import search_web
from config import QWEN_MODEL
from models.schemas import CompetitorAnalysis, CompetitorInsight

SYSTEM_PROMPT = """You are a competitive intelligence analyst writing a due diligence memo.

For each competitor found, explain why they matter to the founder. Return JSON with this structure:
{
  "competitors": [
    {
      "name": "Company name",
      "strength": "What they do well",
      "weakness": "Where they fall short",
      "typical_customer": "Who they serve",
      "opportunity_for_founder": "How the founder can differentiate or win against them"
    }
  ]
}

Rules:
- Include 3-6 competitors.
- Be specific about strengths and weaknesses — not generic.
- opportunity_for_founder must be actionable, not vague.
- Do NOT simply list competitors. Explain their strategic relevance.
"""


async def discover_competitors(idea: str, context: str) -> CompetitorAnalysis:
    query = f"{idea} competitors alternative companies"
    search_results = await search_web(query, max_results=4)

    search_text = "\n".join(
        [
            f"Title: {r.get('title','')}\nContent: {r.get('content','')[:500]}"
            for r in search_results
        ]
    )

    result = await groq_chat_json(
        QWEN_MODEL,
        SYSTEM_PROMPT,
        f"Idea: {idea}\nContext: {context}\n\nSearch results:\n{search_text}",
    )

    competitors = [CompetitorInsight(**c) for c in result.get("competitors", [])]
    return CompetitorAnalysis(competitors=competitors)

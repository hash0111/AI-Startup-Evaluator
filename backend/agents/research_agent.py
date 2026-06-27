from services.groq_client import groq_chat_json
from services.tavily_client import search_web
from config import QWEN_MODEL
from models.schemas import MarketResearch, DemandDriver, MarketKeyRisk

SYSTEM_PROMPT = """You are a market intelligence analyst producing a due diligence report.

Analyze the startup idea and search results. Return JSON with this exact structure:
{
  "industry": "short category name",
  "growth_direction": "Growing / Stable / Declining",
  "market_maturity": "Emerging / Growing / Mature / Declining",
  "demand_drivers": [
    {"driver": "Specific trend or factor", "evidence": "Why this matters, observation, or data point"}
  ],
  "key_risks": [
    {"risk": "Specific risk", "why_it_matters": "Concrete reason this is a concern"}
  ],
  "confidence": 75
}

Rules:
- Every driver and risk must be specific, not generic.
- Include 4-6 demand drivers and 3-5 key risks.
- Avoid vague language like "growing demand" or "high competition" — explain the mechanism.
- confidence: 0-100 based on how reliable your market assessment is.
"""


async def conduct_research(idea: str, answers: list[str]) -> MarketResearch:
    context = "\n".join(answers)
    query = f"{idea} market size trends 2025 2026"
    search_results = await search_web(query, max_results=3)

    search_text = "\n".join(
        [
            f"Title: {r.get('title','')}\nContent: {r.get('content','')[:500]}"
            for r in search_results
        ]
    )

    result = await groq_chat_json(
        QWEN_MODEL,
        SYSTEM_PROMPT,
        f"Idea: {idea}\nFounder context:\n{context}\n\nSearch results:\n{search_text}",
    )

    sources = [
        r.get("url", "")
        for r in search_results
        if r.get("url")
    ]

    drivers = [DemandDriver(**d) for d in result.get("demand_drivers", [])]
    risks = [MarketKeyRisk(**r) for r in result.get("key_risks", [])]

    return MarketResearch(
        industry=result.get("industry", idea),
        growth_direction=result.get("growth_direction", "Growing"),
        market_maturity=result.get("market_maturity", "Growing"),
        demand_drivers=drivers,
        key_risks=risks,
        confidence=result.get("confidence", 75),
        sources=sources,
    )

from services.groq_client import groq_chat_json
from services.tavily_client import search_web
from config import QWEN_MODEL
from models.schemas import MarketResearch

SYSTEM_PROMPT = """You are a market research analyst.
Analyze the search results about a startup idea.
Identify:
- Market category
- Market growth (High/Medium/Low)
- Opportunities (list)
- Threats (list)

Return JSON: {"market": "", "market_growth": "", "opportunities": [], "threats": []}
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

    return MarketResearch(**result, sources=sources)

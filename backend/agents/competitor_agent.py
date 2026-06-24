from services.groq_client import groq_chat_json
from services.tavily_client import search_web
from config import QWEN_MODEL
from models.schemas import CompetitorAnalysis, Competitor

SYSTEM_PROMPT = """You are a competitive intelligence analyst.
Find direct and indirect competitors for a startup idea.
For each competitor provide name, website, type (direct/indirect),
key_differentiator (what makes them unique), and source (URL).

Return JSON: {"competitors": [{"name": "", "website": "", "type": "direct", "key_differentiator": "", "source": ""}]}
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

    return CompetitorAnalysis(**result)

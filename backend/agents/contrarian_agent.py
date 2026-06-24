from services.groq_client import groq_chat_json
from services.tavily_client import search_web
from config import DEEPSEEK_MODEL
from models.schemas import ContrarianReport

SYSTEM_PROMPT = """You are a contrarian investor. Your job is to find reasons why a startup will FAIL.
Be ruthless and evidence-backed. Search for weaknesses.

Identify:
- Why the idea is easy to copy
- Why there's no meaningful moat
- Why the market is crowded
- Why monetization is weak
- Why customer demand is uncertain

Return JSON: {"weaknesses": ["...", "..."]}
"""


async def generate_contrarian_report(idea: str, context: str) -> ContrarianReport:
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
    return ContrarianReport(**result)

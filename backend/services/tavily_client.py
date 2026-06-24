from tavily import TavilyClient
from config import TAVILY_API_KEY

_client = TavilyClient(api_key=TAVILY_API_KEY)


async def search_web(query: str, max_results: int = 5) -> list[dict]:
    result = _client.search(query=query, max_results=max_results)
    return result.get("results", [])

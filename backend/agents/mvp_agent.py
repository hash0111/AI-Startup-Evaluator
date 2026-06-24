from services.groq_client import groq_chat_json
from config import QWEN_MODEL
from models.schemas import MVPRecommendation, MVPBuildFirst, MVPBuildLater, MVPDoNotBuild

SYSTEM_PROMPT = """You are a product manager specializing in MVPs.
Given a startup idea, recommend:

- build_first: 3-5 features for the MVP (absolute essentials)
- build_later: 2-3 features for next version
- do_not_build: 2-3 features to avoid until traction

Be ruthless about scope. The MVP should ship in weeks, not months.

Return JSON: {"build_first": {"features": []}, "build_later": {"features": []}, "do_not_build": {"features": []}}
"""


async def recommend_mvp(idea: str, context: str) -> MVPRecommendation:
    result = await groq_chat_json(
        QWEN_MODEL,
        SYSTEM_PROMPT,
        f"Idea: {idea}\n\nContext:\n{context}",
    )
    build_first = MVPBuildFirst(**result["build_first"])
    build_later = MVPBuildLater(**result["build_later"])
    do_not_build = MVPDoNotBuild(**result["do_not_build"])
    return MVPRecommendation(
        build_first=build_first,
        build_later=build_later,
        do_not_build=do_not_build,
    )

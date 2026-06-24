from services.groq_client import groq_chat_json
from config import QWEN_MODEL
from models.schemas import (
    EvaluationScore,
    MarketResearch,
    CompetitorAnalysis,
    RiskAnalysis,
    ContrarianReport,
    ImprovementSuggestions,
    MVPRecommendation,
)

SYSTEM_PROMPT = """You are a venture capital analyst providing a final startup evaluation.

Given all research data, score each dimension 1-10 and provide an overall verdict.
Scores must reflect reality, not optimism.
Include a confidence_score (0-100) indicating how sure you are about this assessment.

Return JSON: {"market_opportunity": 0, "competition": 0, "technical_feasibility": 0, "monetization": 0, "distribution": 0, "overall_verdict": "", "confidence_score": 75}
"""


async def evaluate(
    idea: str,
    market: MarketResearch,
    competitors: CompetitorAnalysis,
    risks: RiskAnalysis,
    contrarian: ContrarianReport,
    improvements: ImprovementSuggestions,
    mvp: MVPRecommendation,
) -> EvaluationScore:
    context = f"""
Market: {market.model_dump_json(indent=2)}
Competitors: {competitors.model_dump_json(indent=2)}
Risks: {risks.model_dump_json(indent=2)}
Contrarian: {contrarian.model_dump_json(indent=2)}
Improvements: {improvements.model_dump_json(indent=2)}
MVP: {mvp.model_dump_json(indent=2)}
"""
    result = await groq_chat_json(
        QWEN_MODEL,
        SYSTEM_PROMPT,
        f"Startup Idea: {idea}\n\nResearch Data:\n{context}",
    )
    int_keys = ["market_opportunity", "competition", "technical_feasibility", "monetization", "distribution", "confidence_score"]
    for key in int_keys:
        if key in result:
            result[key] = round(float(result[key]))
    return EvaluationScore(**result)

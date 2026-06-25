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
    market_summary = f"Market: {market.market} | Growth: {market.market_growth} | Opps: {'; '.join(market.opportunities)} | Threats: {'; '.join(market.threats)}"
    comp_summary = "Competitors: " + "; ".join([f"{c.name}({c.type})" for c in competitors.competitors])
    risk_summary = f"Risks: Market={risks.market_risk} | Technical={risks.technical_risk} | Distribution={risks.distribution_risk} | Monetization={risks.monetization_risk}"
    contrarian_summary = "Contrarian: " + "; ".join(contrarian.weaknesses)
    improv_summary = "Improvements: " + "; ".join([f"{s.current} -> {s.improved}" for s in improvements.suggestions])
    mvp_summary = f"MVP: Build first=[{'|'.join(mvp.build_first.features)}] | Later=[{'|'.join(mvp.build_later.features)}] | Avoid=[{'|'.join(mvp.do_not_build.features)}]"

    context = f"""
{market_summary}
{comp_summary}
{risk_summary}
{contrarian_summary}
{improv_summary}
{mvp_summary}
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

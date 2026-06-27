from services.groq_client import groq_chat_json
from config import QWEN_MODEL
from models.schemas import (
    EvaluationScore,
    MarketResearch,
    CompetitorAnalysis,
    RiskAnalysis,
    StrategicChallenges,
    ImprovementSuggestions,
    MVPRecommendation,
)

SYSTEM_PROMPT = """You are a venture capital analyst producing a final evaluation score.

Given all research data, score each dimension 1-10 and provide an overall verdict.
Scores must reflect reality, not optimism.

Scoring guidance:
- market_opportunity: Size, growth, urgency of the problem
- competition: How difficult it will be to win (higher = less competition, more favorable)
- technical_feasibility: Can it be built with reasonable resources
- monetization: Willingness to pay, margin potential
- distribution: Cost and difficulty of acquiring customers

Include a confidence_score (0-100) indicating how sure you are about this assessment.

Return JSON: {"market_opportunity": 0, "competition": 0, "technical_feasibility": 0, "monetization": 0, "distribution": 0, "overall_verdict": "Promising / Refine / High Risk / Not Recommended", "confidence_score": 75}

Rules:
- overall_verdict must be one of: "Promising", "Refine", "High Risk", "Not Recommended"
- Be honest — not every startup deserves a "Promising"
"""


async def evaluate(
    idea: str,
    market: MarketResearch,
    competitors: CompetitorAnalysis,
    risks: RiskAnalysis,
    contrarian: StrategicChallenges,
    improvements: ImprovementSuggestions,
    mvp: MVPRecommendation,
) -> EvaluationScore:
    market_summary = f"Industry: {market.industry} | Growth: {market.growth_direction} | Maturity: {market.market_maturity} | Drivers: {'; '.join([d.driver for d in market.demand_drivers])} | Risks: {'; '.join([r.risk for r in market.key_risks])}"
    comp_summary = "Competitors: " + "; ".join([f"{c.name}(strength={c.strength}, opp={c.opportunity_for_founder})" for c in competitors.competitors])
    risk_summary = "Risks: " + "; ".join([f"{r.risk_name}={r.probability}/{r.impact}" for r in risks.risks])
    contrarian_summary = "Challenges: " + "; ".join([c.assumption for c in contrarian.challenges])
    improv_summary = "Improvements: " + "; ".join([f"{s.current_situation} -> {s.recommendation}" for s in improvements.suggestions])
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

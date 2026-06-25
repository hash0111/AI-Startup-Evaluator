from services.groq_client import groq_chat_json
from config import QWEN_MODEL
from models.schemas import (
    FounderBlueprint,
    Persona,
    MonetizationOption,
    Milestone,
    AcquisitionChannel,
    ToolRecommendation,
    MarketResearch,
    CompetitorAnalysis,
    RiskAnalysis,
    ContrarianReport,
    ImprovementSuggestions,
    MVPRecommendation,
    EvaluationScore,
)

SYSTEM_PROMPT = """You are a startup strategy consultant generating a founder blueprint.
Given all research data, produce actionable recommendations.

Return JSON with this exact structure:
{
  "verdict": "GO" or "REFINE" or "DROP",
  "verdict_explanation": "2-3 sentence rationale",
  "personas": [
    {"title": "Persona name", "description": "Who they are", "pain_point": "Primary problem"}
  ],
  "monetization_models": [
    {"model": "Name", "description": "How it works", "recommended": false}
  ],
  "launch_plan_90_days": [
    {"title": "Day 0-30", "description": "Actionable milestone"},
    {"title": "Day 31-60", "description": "Actionable milestone"},
    {"title": "Day 61-90", "description": "Actionable milestone"}
  ],
  "acquisition_channels": [
    {"platform": "Channel name", "strategy": "Specific approach"}
  ],
  "tools_stack": [
    {"category": "Frontend/Backend/etc", "tool": "Tool name", "pricing": "Free/Freemium/Paid"}
  ]
}

Rules:
- Generate exactly 3 personas, exactly 3 monetization models (mark one recommended=true), exactly 3 milestones
- Generate 4-5 acquisition channels, 6-8 tool recommendations
- Be specific and actionable — avoid generic advice
"""


async def generate_blueprint(
    idea: str,
    founder_answers: list[str],
    market: MarketResearch,
    competitors: CompetitorAnalysis,
    risks: RiskAnalysis,
    contrarian: ContrarianReport,
    improvements: ImprovementSuggestions,
    mvp: MVPRecommendation,
    evaluation: EvaluationScore,
) -> FounderBlueprint:
    answers_context = "\n".join(
        [f"Q{i+1}: {a}" for i, a in enumerate(founder_answers)]
    )
    market_short = f"{market.market} | Growth: {market.market_growth} | Opps: {'; '.join(market.opportunities)} | Threats: {'; '.join(market.threats)}"
    comps_short = "; ".join([f"{c.name}({c.type})" for c in competitors.competitors])
    risks_short = "; ".join([f"{r.label}: {r.value[:100]}" for r in [
        type('_', (), {'label': 'Market', 'value': risks.market_risk})(),
        type('_', (), {'label': 'Technical', 'value': risks.technical_risk})(),
        type('_', (), {'label': 'Distribution', 'value': risks.distribution_risk})(),
        type('_', (), {'label': 'Monetization', 'value': risks.monetization_risk})(),
    ]])
    contrarian_short = "; ".join(contrarian.weaknesses)
    improv_short = "; ".join([f"{s.current} → {s.improved}" for s in improvements.suggestions])
    mvp_short = f"Build first: {'; '.join(mvp.build_first.features)} | Later: {'; '.join(mvp.build_later.features)} | Avoid: {'; '.join(mvp.do_not_build.features)}"
    eval_short = f"Scores: market_opp={evaluation.market_opportunity} comp={evaluation.competition} tech={evaluation.technical_feasibility} monet={evaluation.monetization} dist={evaluation.distribution} | Verdict: {evaluation.overall_verdict} (confidence={evaluation.confidence_score})"

    context = f"""
Idea: {idea}
Founder: {answers_context}

Market: {market_short}
Competitors: {comps_short}
Risks: {risks_short}
Contrarian: {contrarian_short}
Improvements: {improv_short}
MVP: {mvp_short}
Evaluation: {eval_short}
"""

    result = await groq_chat_json(
        QWEN_MODEL,
        SYSTEM_PROMPT,
        f"Generate a founder blueprint for this startup idea:\n\n{context}",
    )

    personas = [Persona(**p) for p in result["personas"]]
    monetization = [MonetizationOption(**m) for m in result["monetization_models"]]
    milestones = [Milestone(**m) for m in result["launch_plan_90_days"]]
    channels = [AcquisitionChannel(**c) for c in result["acquisition_channels"]]
    tools = [ToolRecommendation(**t) for t in result["tools_stack"]]

    return FounderBlueprint(
        verdict=result["verdict"],
        verdict_explanation=result.get("verdict_explanation", ""),
        personas=personas,
        monetization_models=monetization,
        launch_plan_90_days=milestones,
        acquisition_channels=channels,
        tools_stack=tools,
    )

from services.groq_client import groq_chat_json
from config import QWEN_MODEL
from models.schemas import (
    FounderBlueprint,
    Persona,
    MonetizationOption,
    Milestone,
    AcquisitionChannel,
    ToolRecommendation,
    ExecutiveRecommendation,
    MarketResearch,
    CompetitorAnalysis,
    RiskAnalysis,
    StrategicChallenges,
    ImprovementSuggestions,
    MVPRecommendation,
    EvaluationScore,
)

SYSTEM_PROMPT = """You are a McKinsey engagement manager writing a founder due diligence memo.
Given all research data, produce a structured strategic blueprint.

Return JSON with this exact structure:
{
  "verdict": "GO" or "REFINE" or "DROP",
  "verdict_explanation": "2-3 sentence rationale",
  "target_audience": [
    {
      "title": "Persona name",
      "industry": "Industry they work in",
      "company_size": "e.g., 1-10 employees, 50-200",
      "budget_range": "e.g., Rs. 30,000 - 80,000",
      "buying_trigger": "What makes them buy",
      "buying_objection": "Why they might not buy",
      "urgency": "High / Medium / Low — how urgently they need this",
      "expected_lifetime_value": "e.g., Rs. 2,00,000 over 3 years"
    }
  ],
  "monetization_models": [
    {
      "model": "Name of model",
      "implementation_difficulty": "Easy / Medium / Hard",
      "revenue_predictability": "High / Medium / Low",
      "scalability": "High / Medium / Low",
      "cash_flow": "Immediate / Delayed",
      "recommendation": "Recommended" or "Alternative"
    }
  ],
  "launch_plan_90_days": [
    {
      "title": "Phase label e.g. 'Week 1-4'",
      "objective": "What to achieve",
      "action": "Specific actions to take",
      "expected_result": "What success looks like",
      "success_metric": "Measurable KPI"
    }
  ],
  "acquisition_channels": [
    {
      "platform": "Channel name",
      "strategy": "Specific approach",
      "expected_outcome": "What to expect in terms of reach or conversions"
    }
  ],
  "tools_stack": [
    {
      "category": "Frontend/Backend/Marketing/etc",
      "tool": "Tool name",
      "pricing": "Free / Freemium / Paid"
    }
  ],
  "executive_recommendations": [
    {
      "action": "What to do",
      "reason": "Why this matters",
      "expected_outcome": "What to expect",
      "priority": "Critical / High / Medium",
      "time_horizon": "e.g., 30 days, 90 days"
    }
  ]
}

Rules:
- Generate exactly 3 personas, exactly 3 monetization models (mark one recommendation="Recommended"), exactly 3 milestones
- Generate 4-5 acquisition channels, 6-8 tool recommendations, 5 executive recommendations
- Be specific and actionable — avoid generic advice like "build a great team" or "focus on marketing"
- Write like a consultant: evidence-based, structured, decision-focused
"""


async def generate_blueprint(
    idea: str,
    founder_answers: list[str],
    market: MarketResearch,
    competitors: CompetitorAnalysis,
    risks: RiskAnalysis,
    contrarian: StrategicChallenges,
    improvements: ImprovementSuggestions,
    mvp: MVPRecommendation,
    evaluation: EvaluationScore,
) -> FounderBlueprint:
    answers_context = "\n".join(
        [f"Q{i+1}: {a}" for i, a in enumerate(founder_answers)]
    )
    market_short = f"Industry: {market.industry} | Growth: {market.growth_direction} | Maturity: {market.market_maturity} | Drivers: {'; '.join([d.driver for d in market.demand_drivers])} | Risks: {'; '.join([r.risk for r in market.key_risks])}"
    comps_short = "; ".join([f"{c.name}(strength={c.strength}, opportunity={c.opportunity_for_founder})" for c in competitors.competitors])
    risks_short = "; ".join([f"{r.risk_name}: prob={r.probability}, impact={r.impact}, mitigation={r.mitigation_strategy}" for r in risks.risks])
    contrarian_short = "; ".join([f"Assumption: {c.assumption} | Alternative: {c.alternative_approach}" for c in contrarian.challenges])
    improv_short = "; ".join([f"{s.current_situation} → {s.recommendation} (impact: {s.expected_impact}, priority: {s.priority})" for s in improvements.suggestions])
    mvp_short = f"Build first: {'; '.join(mvp.build_first.features)} | Later: {'; '.join(mvp.build_later.features)} | Avoid: {'; '.join(mvp.do_not_build.features)}"
    eval_short = f"Scores: market_opp={evaluation.market_opportunity} comp={evaluation.competition} tech={evaluation.technical_feasibility} monet={evaluation.monetization} dist={evaluation.distribution} | Verdict: {evaluation.overall_verdict} (confidence={evaluation.confidence_score})"

    context = f"""
Idea: {idea}
Founder: {answers_context}

Market: {market_short}
Competitors: {comps_short}
Risks: {risks_short}
Challenges: {contrarian_short}
Improvements: {improv_short}
MVP: {mvp_short}
Evaluation: {eval_short}
"""

    result = await groq_chat_json(
        QWEN_MODEL,
        SYSTEM_PROMPT,
        f"Generate a founder blueprint for this startup idea:\n\n{context}",
    )

    personas = [Persona(**p) for p in result["target_audience"]]
    monetization = [MonetizationOption(**m) for m in result["monetization_models"]]
    milestones = [Milestone(**m) for m in result["launch_plan_90_days"]]
    channels = [AcquisitionChannel(**c) for c in result["acquisition_channels"]]
    tools = [ToolRecommendation(**t) for t in result["tools_stack"]]
    exec_recs = [ExecutiveRecommendation(**e) for e in result.get("executive_recommendations", [])]

    return FounderBlueprint(
        verdict=result["verdict"],
        verdict_explanation=result.get("verdict_explanation", ""),
        target_audience=personas,
        monetization_models=monetization,
        launch_plan_90_days=milestones,
        acquisition_channels=channels,
        tools_stack=tools,
        executive_recommendations=exec_recs,
    )

import json
from services.groq_client import groq_chat_json, DEEPSEEK_MODEL

REPORT_SYSTEM_PROMPT = """You are a senior due diligence analyst at a top-tier venture capital firm. Generate a complete startup evaluation report as a single valid JSON object.

The output must follow this exact schema — every field must be populated with detailed, evidence-based analysis. Do NOT omit fields. Do NOT use placeholder text.

{
  "idea": "the startup idea text",
  "market_research": {
    "industry": "industry name",
    "growth_direction": "Growing/Stable/Declining",
    "market_maturity": "Emerging/Growing/Mature/Declining",
    "demand_drivers": [{"driver": "driver description", "evidence": "evidence text"}],
    "key_risks": [{"risk": "risk description", "why_it_matters": "explanation"}],
    "confidence": 75,
    "sources": ["source 1", "source 2"]
  },
  "competitor_analysis": {
    "competitors": [
      {
        "name": "competitor name",
        "strength": "key strength",
        "weakness": "key weakness",
        "typical_customer": "customer profile",
        "opportunity_for_founder": "gap to exploit"
      }
    ]
  },
  "risk_analysis": {
    "risks": [
      {
        "risk_name": "risk name",
        "probability": "High/Medium/Low",
        "impact": "High/Medium/Low",
        "evidence": "supporting evidence",
        "mitigation_strategy": "how to mitigate",
        "early_warning_signal": "what to watch",
        "owner": "suggested owner"
      }
    ]
  },
  "strategic_challenges": {
    "challenges": [
      {
        "assumption": "founder assumption",
        "why_wrong": "why this may be incorrect",
        "evidence": "evidence",
        "alternative_approach": "what to do instead"
      }
    ]
  },
  "improvement_suggestions": {
    "suggestions": [
      {
        "current_situation": "what they do now",
        "problem": "identified issue",
        "recommendation": "improvement suggestion",
        "expected_impact": "expected outcome",
        "estimated_difficulty": "Easy/Medium/Hard",
        "priority": "Critical/High/Medium/Low",
        "timeline": "Short/Medium/Long-term"
      }
    ]
  },
  "mvp_recommendation": {
    "build_first": {"features": ["feature 1", "feature 2"]},
    "build_later": {"features": ["feature 3", "feature 4"]},
    "do_not_build": {"features": ["feature 5"]}
  },
  "evaluation": {
    "market_opportunity": 7,
    "competition": 6,
    "technical_feasibility": 7,
    "monetization": 6,
    "distribution": 5,
    "overall_verdict": "Strong Consider / Proceed with Caution / Rethink Strategy",
    "confidence_score": 75
  },
  "founder_blueprint": {
    "verdict": "GO / REFINE / DROP",
    "verdict_explanation": "detailed reasoning",
    "target_audience": [
      {
        "title": "persona title",
        "industry": "industry",
        "company_size": "size range",
        "budget_range": "budget",
        "buying_trigger": "trigger",
        "buying_objection": "objection",
        "urgency": "High/Medium/Low",
        "expected_lifetime_value": "LTV estimate"
      }
    ],
    "monetization_models": [
      {
        "model": "model name",
        "implementation_difficulty": "Easy/Medium/Hard",
        "revenue_predictability": "High/Medium/Low",
        "scalability": "High/Medium/Low",
        "cash_flow": "Positive/Neutral/Negative",
        "recommendation": "Recommended/Consider/Avoid"
      }
    ],
    "launch_plan_90_days": [
      {
        "title": "milestone title",
        "objective": "objective",
        "action": "specific action",
        "expected_result": "expected outcome",
        "success_metric": "how to measure"
      }
    ],
    "acquisition_channels": [
      {
        "platform": "channel name",
        "strategy": "approach",
        "expected_outcome": "expected result"
      }
    ],
    "tools_stack": [
      {
        "category": "tool category",
        "tool": "tool name",
        "pricing": "pricing model"
      }
    ],
    "executive_recommendations": [
      {
        "action": "specific action",
        "reason": "why",
        "expected_outcome": "result",
        "priority": "Critical/High/Medium/Low",
        "time_horizon": "0-30 / 30-60 / 60-90 days"
      }
    ]
  }
}

RULES:
- Each field must contain substantive analysis (no filler, no placeholders)
- Market research: 3-5 demand drivers, 2-4 key risks, provide real-looking sources
- Competitor analysis: analyze 3-6 competitors with specific differentiation
- Risk analysis: 4-8 risks with specific probability/impact evidence
- Strategic challenges: 2-4 assumptions that might be wrong
- Improvement suggestions: 3-5 actionable recommendations with difficulty/priority/timeline
- Evaluation scores: 1-10 integer on each dimension, explain the verdict
- Founder blueprint: 2-3 personas, 3-4 monetization models, 4-6 milestones, 2-4 channels, 3-5 tools, 3-5 executive recommendations
- Be specific, quantitative where possible, never generic
- Confidence scores should reflect the quality and quantity of information provided"""


async def generate_report(
    idea: str,
    answers: list[str],
) -> dict:
    answers_text = "\n".join(f"Q{i+1}: {a}" for i, a in enumerate(answers))
    user_prompt = f"""Startup Idea: {idea}

Founder Interview Responses:
{answers_text}

Generate the complete due diligence report as a single valid JSON object. Every section must be fully populated with detailed analysis."""

    result = await groq_chat_json(
        model=DEEPSEEK_MODEL,
        system_prompt=REPORT_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        max_tokens=8192,
    )

    return result

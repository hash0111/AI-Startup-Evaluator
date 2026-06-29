import httpx
import json
from config import MISTRAL_API_KEY, MISTRAL_MODEL, MISTRAL_BASE_URL


MISTRAL_TIMEOUT = 120


async def mistral_chat_stream(
    messages: list[dict],
    model: str | None = None,
) -> httpx.Response:
    api_key = MISTRAL_API_KEY
    if not api_key:
        raise ValueError("MISTRAL_API_KEY is not set")

    url = f"{MISTRAL_BASE_URL}/chat/completions"
    payload = {
        "model": model or MISTRAL_MODEL,
        "messages": messages,
        "stream": True,
        "temperature": 0.3,
        "max_tokens": 4096,
    }

    client = httpx.AsyncClient(timeout=MISTRAL_TIMEOUT)
    try:
        resp = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        resp.raise_for_status()
        return resp
    except httpx.HTTPStatusError as e:
        body = await e.response.aread()
        body_text = body.decode() if body else "(no body)"
        await client.aclose()
        raise RuntimeError(f"Mistral API {e.response.status_code}: {body_text}")
    except Exception:
        await client.aclose()
        raise


def build_report_context(report: dict) -> str:
    lines = []
    lines.append(f"STARTUP IDEA: {report.get('idea', 'N/A')}")
    lines.append("")

    eval_data = report.get("evaluation", {})
    lines.append("--- EVALUATION SCORES ---")
    scores_map = {
        "Market Opportunity": eval_data.get("market_opportunity"),
        "Competition": eval_data.get("competition"),
        "Technical Feasibility": eval_data.get("technical_feasibility"),
        "Monetization": eval_data.get("monetization"),
        "Distribution": eval_data.get("distribution"),
    }
    for label, score in scores_map.items():
        if score is not None:
            lines.append(f"  {label}: {score}/10")
    if eval_data.get("overall_verdict"):
        lines.append(f"  Overall Verdict: {eval_data['overall_verdict']}")
    if eval_data.get("confidence_score"):
        lines.append(f"  Confidence Score: {eval_data['confidence_score']}/100")
    lines.append("")

    market = report.get("market_research", {})
    lines.append("--- MARKET RESEARCH ---")
    if market.get("industry"):
        lines.append(f"  Industry: {market['industry']}")
    if market.get("growth_direction"):
        lines.append(f"  Growth Direction: {market['growth_direction']}")
    if market.get("market_maturity"):
        lines.append(f"  Market Maturity: {market['market_maturity']}")
    for dd in market.get("demand_drivers", []):
        lines.append(f"  Demand Driver: {dd.get('driver', '')} — {dd.get('evidence', '')}")
    for kr in market.get("key_risks", []):
        lines.append(f"  Market Risk: {kr.get('risk', '')} — {kr.get('why_it_matters', '')}")
    lines.append("")

    competitors = report.get("competitor_analysis", {}).get("competitors", [])
    lines.append("--- COMPETITOR ANALYSIS ---")
    for c in competitors:
        lines.append(f"  - {c.get('name', 'Unknown')}: Strength={c.get('strength', '')}, "
                     f"Weakness={c.get('weakness', '')}, "
                     f"Target={c.get('typical_customer', '')}, "
                     f"Opportunity={c.get('opportunity_for_founder', '')}")
    lines.append("")

    risks = report.get("risk_analysis", {}).get("risks", [])
    lines.append("--- RISK ANALYSIS ---")
    for r in risks:
        lines.append(f"  - {r.get('risk_name', 'Unknown')}: "
                     f"Probability={r.get('probability', '')}, "
                     f"Impact={r.get('impact', '')}, "
                     f"Mitigation={r.get('mitigation_strategy', '')}")
    lines.append("")

    challenges = report.get("strategic_challenges", {}).get("challenges", [])
    lines.append("--- STRATEGIC CHALLENGES ---")
    for c in challenges:
        lines.append(f"  - Assumption: {c.get('assumption', '')}")
        lines.append(f"    Why Wrong: {c.get('why_wrong', '')}")
        lines.append(f"    Alternative: {c.get('alternative_approach', '')}")
    lines.append("")

    improvements = report.get("improvement_suggestions", {}).get("suggestions", [])
    lines.append("--- IMPROVEMENT SUGGESTIONS ---")
    for s in improvements:
        lines.append(f"  - {s.get('recommendation', '')} (Priority: {s.get('priority', '')}, "
                     f"Difficulty: {s.get('estimated_difficulty', '')})")
    lines.append("")

    mvp = report.get("mvp_recommendation", {})
    lines.append("--- MVP RECOMMENDATION ---")
    for feat in mvp.get("build_first", {}).get("features", []):
        lines.append(f"  Build First: {feat}")
    for feat in mvp.get("build_later", {}).get("features", []):
        lines.append(f"  Build Later: {feat}")
    for feat in mvp.get("do_not_build", {}).get("features", []):
        lines.append(f"  Do Not Build: {feat}")
    lines.append("")

    blueprint = report.get("founder_blueprint")
    if blueprint:
        lines.append("--- FOUNDER BLUEPRINT ---")
        if blueprint.get("verdict"):
            lines.append(f"  Verdict: {blueprint['verdict']}")
        if blueprint.get("verdict_explanation"):
            lines.append(f"  Explanation: {blueprint['verdict_explanation']}")
        for persona in blueprint.get("target_audience", []):
            lines.append(f"  Persona: {persona.get('title', '')} ({persona.get('industry', '')})")
        for model in blueprint.get("monetization_models", []):
            lines.append(f"  Monetization: {model.get('model', '')} — {model.get('recommendation', '')}")
        for ch in blueprint.get("acquisition_channels", []):
            lines.append(f"  Channel: {ch.get('platform', '')} — {ch.get('strategy', '')}")
        for ex in blueprint.get("executive_recommendations", []):
            lines.append(f"  Action: {ex.get('action', '')} (Priority: {ex.get('priority', '')})")
        lines.append("")

    return "\n".join(lines)


SYSTEM_PROMPT = """You are an AI Due Diligence Consultant. You are assisting the founder based exclusively on their generated startup evaluation report. Your knowledge is limited to the report provided below.

Reference the report whenever possible. Do not invent facts. If information is unavailable, clearly state that it is not present in the evaluation. Answer like a senior startup consultant from McKinsey, BCG, or Sequoia.

Be specific, evidence-based, and actionable. Use bullet points, tables, and structured formatting when helpful. Keep responses concise but thorough."""

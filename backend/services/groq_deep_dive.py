import json
import asyncio
import random
import httpx
from config import GROQ_DEEP_DIVE_API_KEY, GROQ_BASE_URL, DEEPSEEK_MODEL

HEADERS = {
    "Authorization": f"Bearer {GROQ_DEEP_DIVE_API_KEY}",
    "Content-Type": "application/json",
}

_last_request_time = 0
_request_lock = asyncio.Lock()
MIN_INTERVAL = 10.0

async def _throttle():
    global _last_request_time
    async with _request_lock:
        now = asyncio.get_event_loop().time()
        elapsed = now - _last_request_time
        if elapsed < MIN_INTERVAL:
            wait = MIN_INTERVAL - elapsed
            await asyncio.sleep(wait)
        _last_request_time = asyncio.get_event_loop().time()

SECTION_REQUIRED_FIELDS: dict[str, str] = {
    "market-intelligence": """Required JSON fields: executive_summary, key_findings (8-12), detailed_analysis (array of {heading, content, evidence[]}), market_data {tam, sam, som, growth_rate, market_maturity}, competitive_landscape, opportunities[] (with impact, timeframe), risks[] (with severity, mitigation), strategic_implications[], recommendations[] (with rationale, priority), analyst_notes, sources[]""",

    "competitor-intelligence": """Required JSON fields: executive_summary, key_findings (8-12), detailed_analysis[] (heading, content, evidence[]), competitor_table[] (name, strength, weakness, pricing, market_share, threat_level, differentiator), competitive_advantages[], competitive_threats[] (severity, timeframe), positioning_recommendations[] (strategy, rationale, expected_outcome), strategic_implications[], recommendations[] (rationale, priority), analyst_notes, sources[]""",

    "target-audience": """Required JSON fields: executive_summary, key_findings (8-12), detailed_analysis[] (heading, content, evidence[]), persona_table[] (name, demographics, pain_points[], budget, buying_triggers[], objections[], channel_preference, ltv_estimate), market_segmentation, opportunities[] (impact, effort), risks[] (severity, mitigation), strategic_implications[], recommendations[] (rationale, priority), analyst_notes, sources[]""",

    "monetization-strategy": """Required JSON fields: executive_summary, key_findings (8-12), detailed_analysis[] (heading, content, evidence[]), revenue_models[] (model, description, projected_revenue, margin, complexity, risk, recommendation), unit_economics {cac, ltv, ltv_cac_ratio, payback_period, gross_margin}, opportunities[] (revenue_impact, effort), risks[] (severity, mitigation), strategic_implications[], recommendations[] (rationale, priority), analyst_notes, sources[]""",

    "go-to-market-plan": """Required JSON fields: executive_summary, key_findings (8-12), detailed_analysis[] (heading, content, evidence[]), launch_timeline[] (phase, duration, activities[], milestones[], resources_needed), channels[] (channel, strategy, expected_cac, expected_ltv, scale_potential, timeline), opportunities[] (impact, effort), risks[] (severity, mitigation), strategic_implications[], recommendations[] (rationale, priority), analyst_notes, sources[]""",

    "risk-register": """Required JSON fields: executive_summary, key_findings (8-12), detailed_analysis[] (heading, content, evidence[]), risk_table[] (risk, category, probability, impact, risk_score, evidence, mitigation, early_warning, owner, timeline), risk_heatmap, opportunities[] (risk-derived), strategic_implications[], recommendations[] (rationale, priority), risk_monitoring_plan, analyst_notes, sources[]""",
}


def build_system_prompt(section: str, idea: str, answers: list[str]) -> str:
    role_prompts = {
        "market-intelligence": "senior market research analyst at McKinsey & Company",
        "competitor-intelligence": "competitive intelligence analyst at a top consulting firm",
        "target-audience": "customer strategy consultant at Bain & Company",
        "monetization-strategy": "pricing and monetization strategist at BCG",
        "go-to-market-plan": "GTM strategy consultant at McKinsey",
        "risk-register": "risk management consultant at Deloitte",
    }
    role = role_prompts.get(section, "senior strategy consultant")
    fields = SECTION_REQUIRED_FIELDS.get(section, SECTION_REQUIRED_FIELDS["market-intelligence"])
    answers_text = "\n".join(f"- {a}" for a in answers)

    return f"""You are a {role}. Generate a comprehensive {section} Deep Dive as valid JSON only. No markdown, no code fences.

{fields}

STARTUP CONTEXT:
Idea: {idea}

Founder Responses:
{answers_text}

Rules:
- Each detailed_analysis section: 200-400 words of rigorous analysis
- Provide specific quantitative estimates where possible
- Include evidence for every claim
- Never contradict the executive report — expand and justify it
- 8-12 key findings minimum
- Use professional consulting language throughout"""


def extract_relevant_report(report_json: dict, section: str) -> dict:
    top_level_extracts = {
        "market-intelligence": ["market_research", "startup_type", "industry"],
        "competitor-intelligence": ["competitor_analysis", "strategic_challenges", "market_research"],
        "target-audience": ["target_audience", "market_research", "startup_type"],
        "monetization-strategy": ["monetization", "financial_metrics", "business_model"],
        "go-to-market-plan": ["go_to_market", "customer_acquisition", "mvp_roadmap"],
        "risk-register": ["risk_analysis", "strategic_challenges", "financial_metrics"],
    }
    keys = top_level_extracts.get(section, list(report_json.keys())[:4])
    return {k: report_json.get(k) for k in keys if report_json.get(k) is not None}


async def generate_deep_dive(
    section: str,
    idea: str,
    answers: list[str],
    report_json: dict,
) -> dict:
    system_prompt = build_system_prompt(section, idea, answers)
    relevant = extract_relevant_report(report_json, section)

    user_prompt = f"""Here is the relevant portion of the executive report. Use it as context to generate a deep dive for "{section}".

{json.dumps(relevant, indent=None, default=str)[:8000]}

Generate a valid JSON object with all required fields for {section}."""

    body = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.7,
        "max_tokens": 8192,
        "response_format": {"type": "json_object"},
    }

    max_retries = 5

    async with httpx.AsyncClient(timeout=180) as client:
        for attempt in range(max_retries):
            await _throttle()

            resp = await client.post(
                f"{GROQ_BASE_URL}/chat/completions",
                headers=HEADERS,
                json=body,
            )

            if resp.status_code == 429:
                ra_header = resp.headers.get("Retry-After") or resp.headers.get("retry-after")
                try: retry_after = int(ra_header) if ra_header else 0
                except ValueError: retry_after = 0
                base_wait = max(retry_after, 2 ** (attempt + 2))
                wait = base_wait + random.uniform(0, 2)
                print(f"  Deep dive Groq 429, retrying in {wait:.1f}s (attempt {attempt + 1}/{max_retries})")
                await asyncio.sleep(wait)
                continue

            if resp.status_code >= 500:
                wait = 2 ** (attempt + 2) + random.uniform(0, 2)
                print(f"  Deep dive Groq {resp.status_code}, retrying in {wait:.1f}s")
                await asyncio.sleep(wait)
                continue

            if resp.status_code >= 400:
                body_text = resp.text[:500]
                print(f"  Deep dive Groq {resp.status_code}: {body_text}")
                resp.raise_for_status()

            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"].strip()
            if content.startswith("```"):
                content = content.strip("`").strip()
                if content.startswith("json"):
                    content = content[4:].strip()

            return json.loads(content)

    raise Exception(f"Deep dive generation failed after {max_retries} retries")

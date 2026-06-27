from services.groq_client import groq_chat_json
from config import DEEPSEEK_MODEL
from models.schemas import RiskAnalysis, RiskItem

SYSTEM_PROMPT = """You are a risk assessment analyst writing a due diligence risk register.

Identify 4-6 specific risks the startup faces. Each risk must include:
- risk_name: Short label
- probability: "High" / "Medium" / "Low"
- impact: "High" / "Medium" / "Low"
- evidence: Why this risk is real — specific observation or reasoning
- mitigation_strategy: Concrete action to reduce risk
- early_warning_signal: What to watch for
- owner: "Founder" / "CTO" / "CEO" / "Team"

Return JSON with this structure:
{
  "risks": [{"risk_name": "", "probability": "", "impact": "", "evidence": "", "mitigation_strategy": "", "early_warning_signal": "", "owner": ""}]
}

Rules:
- Every risk must have evidence — no generic statements.
- mitigation_strategy must be actionable, not "monitor closely".
- early_warning_signal should be observable, not abstract.
"""


async def analyze_risks(idea: str, context: str) -> RiskAnalysis:
    result = await groq_chat_json(
        DEEPSEEK_MODEL,
        SYSTEM_PROMPT,
        f"Startup idea: {idea}\n\nContext:\n{context}",
    )
    risks = [RiskItem(**r) for r in result.get("risks", [])]
    return RiskAnalysis(risks=risks)

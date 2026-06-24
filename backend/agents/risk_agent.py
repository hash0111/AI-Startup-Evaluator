from services.groq_client import groq_chat_json
from config import DEEPSEEK_MODEL
from models.schemas import RiskAnalysis

SYSTEM_PROMPT = """You are a risk assessment analyst. Be critical and realistic.
Analyze the startup idea across four risk dimensions:

- market_risk: Is the market saturated? Are barriers high?
- technical_risk: Can this be built with reasonable resources?
- distribution_risk: Can users realistically be acquired?
- monetization_risk: Will customers actually pay?

Return JSON: {"market_risk": "", "technical_risk": "", "distribution_risk": "", "monetization_risk": ""}
"""


async def analyze_risks(idea: str, context: str) -> RiskAnalysis:
    result = await groq_chat_json(
        DEEPSEEK_MODEL,
        SYSTEM_PROMPT,
        f"Startup idea: {idea}\n\nContext:\n{context}",
    )
    return RiskAnalysis(**result)

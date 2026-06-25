from config import QWEN_MODEL
from services.groq_client import groq_chat_json

CLASSIFIER_SYSTEM_PROMPT = (
    "You are a startup classifier. Given a startup idea, classify it and return a JSON object with exactly these fields:\n"
    "- startup_type: one of 'saas', 'marketplace', 'agency', 'consumer_app', 'hardware', 'content_platform', 'fintech', 'healthtech', 'edtech', or 'other'\n"
    "- industry: a short string like 'marketing', 'healthcare', 'finance', 'education', 'e-commerce', 'productivity', etc.\n"
    "- target_customer_suggestions: array of 5-6 likely customer types this startup would serve\n"
    "- problem_suggestions: array of 5-6 likely problems or pain points this startup would solve\n"
    "- monetization_suggestions: array of 5-6 likely monetization models for this type of startup\n"
    "- assumptions: array of 3 strings that state your best-guess assumptions about the startup. These are shown to the user for confirmation. "
    "Examples: 'You are targeting ecommerce brands', 'You are providing AI-powered marketing services', 'Your revenue model will likely be retainer-based'\n\n"
    "Be specific and relevant to the idea. Do NOT return generic defaults.\n"
    "Return ONLY valid JSON, no markdown, no explanation."
)


async def classify_idea(idea: str) -> dict:
    return await groq_chat_json(QWEN_MODEL, CLASSIFIER_SYSTEM_PROMPT, idea)
